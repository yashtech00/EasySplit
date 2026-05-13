// ============================================================
// SplitEasy Backend – Complete Implementation Reference
// backend/src/index.js
// Tech: Node.js + Express + Prisma + PostgreSQL
// ============================================================

import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Auth Middleware ──────────────────────────────────────────
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// ─── Helpers ──────────────────────────────────────────────────
const generateInviteCode = () =>
  "GRP-" + Math.floor(1000 + Math.random() * 9000);

const generateUpiLinks = ({ payeeUpiId, payeeName, amount, note, ref }) => {
  const encoded = new URLSearchParams({
    pa: payeeUpiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
    tr: ref,
  }).toString();
  return {
    generic: `upi://pay?${encoded}`,
    gpay: `intent://pay?${encoded}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`,
    paytm: `intent://pay?${encoded}#Intent;scheme=paytm;package=net.one97.paytm;end`,
    phonepe: `intent://pay?${encoded}#Intent;scheme=upi;package=com.phonepe.app;end`,
    bhim: `intent://pay?${encoded}#Intent;scheme=upi;package=in.org.npci.upiapp;end`,
  };
};

const sendPush = async (token, title, body, data = {}) => {
  if (!token) return;
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: token, title, body, data, sound: "default" }),
    });
  } catch (err) {
    console.error("Push notification failed:", err.message);
  }
};

// ============================================================
// AUTH ROUTES
// ============================================================

// POST /api/v1/auth/register
app.post("/api/v1/auth/register", async (req, res) => {
  const { name, email, password, upiId } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, email, and password are required" });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, upiId: upiId || null },
    });

    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });

    // Store refresh token
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id } });

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, upiId: user.upiId },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/auth/login
app.post("/api/v1/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });

    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id } });

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, upiId: user.upiId },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/auth/refresh
app.post("/api/v1/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ success: false, message: "Refresh token required" });

  try {
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored) return res.status(401).json({ success: false, message: "Invalid refresh token" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: "15m" });

    res.json({ success: true, data: { accessToken } });
  } catch {
    res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
});

// POST /api/v1/auth/logout
app.post("/api/v1/auth/logout", authenticate, async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
  }
  res.json({ success: true, message: "Logged out" });
});

// ============================================================
// USER ROUTES
// ============================================================

// GET /api/v1/user/me
app.get("/api/v1/user/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, upiId: true, expoPushToken: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/user/profile
app.patch("/api/v1/user/profile", authenticate, async (req, res) => {
  const { name, upiId } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(name && { name }),
        ...(upiId !== undefined && { upiId }),
      },
      select: { id: true, name: true, email: true, upiId: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/user/push-token
app.patch("/api/v1/user/push-token", authenticate, async (req, res) => {
  const { expoPushToken } = req.body;
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { expoPushToken },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// GROUP ROUTES
// ============================================================

// POST /api/v1/group
app.post("/api/v1/group", authenticate, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "Group name is required" });

  try {
    const inviteCode = generateInviteCode();
    const group = await prisma.group.create({
      data: {
        name,
        inviteCode,
        members: {
          create: { userId: req.userId },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        inviteCode: group.inviteCode,
        members: group.members.map((m) => m.user),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/group/join
app.post("/api/v1/group/join", authenticate, async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ success: false, message: "Invite code required" });

  try {
    const group = await prisma.group.findUnique({
      where: { inviteCode },
      include: { members: true },
    });
    if (!group) return res.status(404).json({ success: false, message: "Invalid invite code" });

    const alreadyMember = group.members.some((m) => m.userId === req.userId);
    if (alreadyMember) return res.status(409).json({ success: false, message: "Already a member" });

    if (group.members.length >= 2) {
      return res.status(409).json({ success: false, message: "Group is full (max 2 members for MVP)" });
    }

    await prisma.groupMember.create({ data: { groupId: group.id, userId: req.userId } });

    const updatedGroup = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, upiId: true } } },
        },
      },
    });

    res.json({
      success: true,
      data: {
        id: updatedGroup.id,
        name: updatedGroup.name,
        members: updatedGroup.members.map((m) => m.user),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/group/:groupId
app.get("/api/v1/group/:groupId", authenticate, async (req, res) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.groupId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, upiId: true } } },
        },
      },
    });
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const isMember = group.members.some((m) => m.user.id === req.userId);
    if (!isMember) return res.status(403).json({ success: false, message: "Not a member of this group" });

    res.json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        inviteCode: group.inviteCode,
        members: group.members.map((m) => m.user),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/group/:groupId/balance
app.get("/api/v1/group/:groupId/balance", authenticate, async (req, res) => {
  const { groupId } = req.params;
  const currentUserId = req.userId;

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { include: { user: true } } },
    });
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const isMember = group.members.some((m) => m.userId === currentUserId);
    if (!isMember) return res.status(403).json({ success: false, message: "Not a member" });

    const otherMember = group.members.find((m) => m.userId !== currentUserId);
    const otherUserId = otherMember?.userId;

    // What the current user owes (their unpaid shares)
    const myUnpaidShares = await prisma.expenseShare.findMany({
      where: { userId: currentUserId, isPaid: false, expense: { groupId } },
    });
    const iOweTotal = myUnpaidShares.reduce((sum, s) => sum + s.shareAmount, 0);

    // What the other user owes (their unpaid shares)
    const theirUnpaidShares = await prisma.expenseShare.findMany({
      where: { userId: otherUserId, isPaid: false, expense: { groupId } },
    });
    const theyOweTotal = theirUnpaidShares.reduce((sum, s) => sum + s.shareAmount, 0);

    // Total group spend
    const allExpenses = await prisma.expense.findMany({ where: { groupId } });
    const totalGroupSpend = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    const net = theyOweTotal - iOweTotal;
    let direction = "SETTLED";
    if (net > 0) direction = "THEY_OWE_YOU";
    if (net < 0) direction = "YOU_OWE_THEM";

    res.json({
      success: true,
      data: {
        totalGroupSpend,
        yourShare: totalGroupSpend / 2,
        theirShare: totalGroupSpend / 2,
        netBalance: {
          direction,
          amount: Math.abs(net),
          person: { id: otherMember.user.id, name: otherMember.user.name },
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/group/:groupId/remind
app.post("/api/v1/group/:groupId/remind", authenticate, async (req, res) => {
  const { targetUserId } = req.body;
  const { groupId } = req.params;

  try {
    // Check cooldown: last reminder within 24 hours
    const recent = await prisma.reminder.findFirst({
      where: {
        groupId,
        sentByUserId: req.userId,
        sentToUserId: targetUserId,
        sentAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (recent) return res.status(429).json({ success: false, message: "Already sent a reminder in the last 24 hours" });

    const sender = await prisma.user.findUnique({ where: { id: req.userId } });
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });

    await sendPush(
      target.expoPushToken,
      "Payment Reminder",
      `${sender.name} is reminding you about a pending payment 👋`
    );

    await prisma.reminder.create({
      data: { groupId, sentByUserId: req.userId, sentToUserId: targetUserId },
    });

    res.json({ success: true, message: "Reminder sent" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// EXPENSE ROUTES
// ============================================================

// POST /api/v1/expense
app.post("/api/v1/expense", authenticate, async (req, res) => {
  const { groupId, title, amount, description, date } = req.body;

  if (!groupId || !title || !amount) {
    return res.status(400).json({ success: false, message: "groupId, title, and amount are required" });
  }
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: "Amount must be a positive number" });
  }

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { include: { user: true } } },
    });
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const isMember = group.members.some((m) => m.userId === req.userId);
    if (!isMember) return res.status(403).json({ success: false, message: "Not a member" });

    const shareAmount = parseFloat((amount / 2).toFixed(2));
    const expenseDate = date ? new Date(date) : new Date();

    const expense = await prisma.expense.create({
      data: {
        groupId,
        addedById: req.userId,
        title,
        description: description || null,
        amount: parseFloat(amount),
        date: expenseDate,
        shares: {
          create: group.members.map((m) => ({
            userId: m.userId,
            shareAmount,
            isPaid: m.userId === req.userId, // person who added it has their share settled
            paidAt: m.userId === req.userId ? new Date() : null,
          })),
        },
      },
      include: {
        addedBy: { select: { id: true, name: true } },
        shares: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    // Push notification to the other member
    const otherMember = group.members.find((m) => m.userId !== req.userId);
    if (otherMember?.user?.expoPushToken) {
      await sendPush(
        otherMember.user.expoPushToken,
        `New Expense: ${title}`,
        `${expense.addedBy.name} added ₹${amount} for ${title}. You owe ₹${shareAmount}.`,
        { screen: "ExpenseDetail", expenseId: expense.id }
      );
    }

    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/group/:groupId/expenses
app.get("/api/v1/group/:groupId/expenses", authenticate, async (req, res) => {
  const { groupId } = req.params;
  const { status, page = 1, limit = 20 } = req.query;

  try {
    const where = { groupId };
    if (status === "paid") {
      where.shares = { every: { isPaid: true } };
    } else if (status === "unpaid") {
      where.shares = { some: { isPaid: false } };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { date: "desc" },
        include: {
          addedBy: { select: { id: true, name: true } },
          shares: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    const formattedExpenses = expenses.map((e) => {
      const myShare = e.shares.find((s) => s.userId === req.userId);
      const isSettled = e.shares.every((s) => s.isPaid);
      return {
        id: e.id,
        title: e.title,
        amount: e.amount,
        date: e.date,
        description: e.description,
        addedBy: e.addedBy,
        myShare: myShare ? { id: myShare.id, shareAmount: myShare.shareAmount, isPaid: myShare.isPaid } : null,
        isSettled,
      };
    });

    res.json({
      success: true,
      data: {
        expenses: formattedExpenses,
        pagination: { page: parseInt(page), limit: parseInt(limit), total },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/expense/:expenseId
app.get("/api/v1/expense/:expenseId", authenticate, async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.expenseId },
      include: {
        addedBy: { select: { id: true, name: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true } },
            payment: true,
          },
        },
      },
    });
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });

    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/expense/:expenseId
app.delete("/api/v1/expense/:expenseId", authenticate, async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.expenseId },
      include: { shares: true },
    });
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
    if (expense.addedById !== req.userId) return res.status(403).json({ success: false, message: "Not your expense" });

    const anyPaid = expense.shares.some((s) => s.isPaid && s.userId !== req.userId);
    if (anyPaid) return res.status(409).json({ success: false, message: "Cannot delete: payment already made" });

    await prisma.expenseShare.deleteMany({ where: { expenseId: expense.id } });
    await prisma.expense.delete({ where: { id: expense.id } });

    res.json({ success: true, message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// PAYMENT ROUTES
// ============================================================

// POST /api/v1/payment/initiate
app.post("/api/v1/payment/initiate", authenticate, async (req, res) => {
  const { shareId } = req.body;
  if (!shareId) return res.status(400).json({ success: false, message: "shareId is required" });

  try {
    const share = await prisma.expenseShare.findUnique({
      where: { id: shareId },
      include: {
        expense: {
          include: {
            addedBy: { select: { id: true, name: true, upiId: true } },
          },
        },
        payment: true,
      },
    });

    if (!share) return res.status(404).json({ success: false, message: "Share not found" });
    if (share.userId !== req.userId) return res.status(403).json({ success: false, message: "Not your share" });
    if (share.isPaid) return res.status(409).json({ success: false, message: "Already paid" });

    // If there's an existing non-confirmed payment, reuse it
    if (share.payment && share.payment.status === "INITIATED") {
      const upiLinks = generateUpiLinks({
        payeeUpiId: share.expense.addedBy.upiId,
        payeeName: share.expense.addedBy.name,
        amount: share.shareAmount,
        note: `${share.expense.title} - SplitEasy`,
        ref: `splitEasy_${share.id}`,
      });
      return res.json({
        success: true,
        data: {
          paymentId: share.payment.id,
          shareAmount: share.shareAmount,
          payee: share.expense.addedBy,
          upiLinks,
          transactionRef: `splitEasy_${share.id}`,
        },
      });
    }

    const payee = share.expense.addedBy;
    if (!payee.upiId) {
      return res.status(400).json({ success: false, message: "Payee has not set a UPI ID" });
    }

    const payment = await prisma.payment.create({
      data: {
        shareId,
        payerId: req.userId,
        payeeId: payee.id,
        amount: share.shareAmount,
        status: "INITIATED",
      },
    });

    const upiLinks = generateUpiLinks({
      payeeUpiId: payee.upiId,
      payeeName: payee.name,
      amount: share.shareAmount,
      note: `${share.expense.title} - SplitEasy`,
      ref: `splitEasy_${share.id}`,
    });

    res.status(201).json({
      success: true,
      data: {
        paymentId: payment.id,
        shareAmount: share.shareAmount,
        payee: { id: payee.id, name: payee.name, upiId: payee.upiId },
        upiLinks,
        transactionRef: `splitEasy_${share.id}`,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/payment/:paymentId/app
app.patch("/api/v1/payment/:paymentId/app", authenticate, async (req, res) => {
  const { upiApp } = req.body;
  try {
    await prisma.payment.update({
      where: { id: req.params.paymentId },
      data: { upiApp },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/payment/:paymentId/confirm
app.patch("/api/v1/payment/:paymentId/confirm", authenticate, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.paymentId },
      include: {
        share: { include: { expense: true } },
        payee: { select: { id: true, name: true, expoPushToken: true } },
        payer: { select: { id: true, name: true } },
      },
    });

    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    if (payment.payerId !== req.userId) return res.status(403).json({ success: false, message: "Not your payment" });
    if (payment.status === "CONFIRMED") return res.status(409).json({ success: false, message: "Already confirmed" });

    const now = new Date();
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "CONFIRMED", confirmedAt: now },
      }),
      prisma.expenseShare.update({
        where: { id: payment.shareId },
        data: { isPaid: true, paidAt: now },
      }),
    ]);

    // Notify payee
    await sendPush(
      payment.payee.expoPushToken,
      "Payment Received ✅",
      `${payment.payer.name} paid ₹${payment.amount} for ${payment.share.expense.title}`,
      { screen: "ExpenseDetail", expenseId: payment.share.expenseId }
    );

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        status: "CONFIRMED",
        paidAt: now,
        shareId: payment.shareId,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/payment/:paymentId/fail
app.patch("/api/v1/payment/:paymentId/fail", authenticate, async (req, res) => {
  try {
    await prisma.payment.update({
      where: { id: req.params.paymentId },
      data: { status: "FAILED" },
    });
    res.json({ success: true, message: "Payment marked as failed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/payment/:paymentId
app.get("/api/v1/payment/:paymentId", authenticate, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.paymentId },
      select: {
        id: true,
        status: true,
        upiApp: true,
        amount: true,
        initiatedAt: true,
        confirmedAt: true,
      },
    });
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SplitEasy API running on port ${PORT}`);
});

export default app;

// ============================================================
// PRISMA SCHEMA ADDITIONS needed for this file
// Add to schema.prisma:
//
// model RefreshToken {
//   id        String   @id @default(uuid())
//   token     String   @unique
//   userId    String
//   createdAt DateTime @default(now())
//   user      User     @relation(fields: [userId], references: [id])
// }
//
// model Reminder {
//   id           String   @id @default(uuid())
//   groupId      String
//   sentByUserId String
//   sentToUserId String
//   sentAt       DateTime @default(now())
//   group        Group    @relation(fields: [groupId], references: [id])
// }
//
// Add inviteCode field to Group model:
// inviteCode  String  @unique
//
// Add refreshTokens to User model:
// refreshTokens RefreshToken[]
// remindersGiven Reminder[] @relation("SentBy")
// remindersReceived Reminder[] @relation("SentTo")
// ============================================================

// ============================================================
// PACKAGE.JSON dependencies
// {
//   "type": "module",
//   "dependencies": {
//     "@prisma/client": "^5.0.0",
//     "bcrypt": "^5.1.0",
//     "cors": "^2.8.5",
//     "express": "^4.18.0",
//     "jsonwebtoken": "^9.0.0"
//   },
//   "devDependencies": {
//     "prisma": "^5.0.0"
//   }
// }
// ============================================================

/**
 * Notification Service - handles push notifications via Expo Push API
 */

// Send push notification via Expo
const sendPush = async (expoPushToken, title, body, data = {}) => {
  try {
    if (!expoPushToken) {
      console.log('⚠️ No push token provided, skipping notification');
      return false;
    }

    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high'
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(message)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Expo Push API error:', result);
      return false;
    }

    console.log(`✅ Push notification sent: "${title}"`);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

// Send notification when expense is added
const notifyExpenseAdded = async (toUser, byUser, expense) => {
  const title = 'New Expense Added';
  const body = `${byUser.name} added ₹${expense.amount} for ${expense.title}. You owe ₹${expense.amount / 2}.`;
  const data = {
    type: 'expense_added',
    expenseId: expense.id,
    groupId: expense.groupId
  };

  return await sendPush(toUser.expoPushToken, title, body, data);
};

// Send notification when payment is received
const notifyPaymentReceived = async (toUser, byUser, amount, expenseTitle) => {
  const title = 'Payment Received ✅';
  const body = `${byUser.name} paid ₹${amount} for ${expenseTitle}.`;
  const data = {
    type: 'payment_received',
    amount: amount.toString()
  };

  return await sendPush(toUser.expoPushToken, title, body, data);
};

// Send reminder notification
const notifyReminder = async (toUser, fromUser, amount, expenseTitle) => {
  const title = 'Payment Reminder 💰';
  const body = `Friendly reminder: You owe ${fromUser.name} ₹${amount} for ${expenseTitle} 👋`;
  const data = {
    type: 'payment_reminder',
    amount: amount.toString(),
    fromUserId: fromUser.id
  };

  return await sendPush(toUser.expoPushToken, title, body, data);
};

// Send notification when user joins a group
const notifyGroupJoined = async (toUser, newUser, groupName) => {
  const title = 'New Group Member';
  const body = `${newUser.name} joined your group "${groupName}".`;
  const data = {
    type: 'group_joined',
    userId: newUser.id,
    groupName
  };

  return await sendPush(toUser.expoPushToken, title, body, data);
};

// Send notification when expense is deleted
const notifyExpenseDeleted = async (toUser, byUser, expenseTitle) => {
  const title = 'Expense Deleted';
  const body = `${byUser.name} deleted the expense "${expenseTitle}".`;
  const data = {
    type: 'expense_deleted',
    expenseTitle
  };

  return await sendPush(toUser.expoPushToken, title, body, data);
};

// Send welcome notification when user completes profile
const notifyWelcome = async (user) => {
  const title = 'Welcome to SplitEasy! 🎉';
  const body = 'Start splitting expenses with your friends. Create or join a group to get started!';
  const data = {
    type: 'welcome'
  };

  return await sendPush(user.expoPushToken, title, body, data);
};

// Batch send notifications to multiple users
const sendBatchNotifications = async (notifications) => {
  const results = await Promise.allSettled(
    notifications.map(({ user, title, body, data }) => 
      sendPush(user.expoPushToken, title, body, data)
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failed = results.length - successful;

  console.log(`📊 Batch notification results: ${successful} sent, ${failed} failed`);
  return { successful, failed };
};

// Export all notification functions
export {
  sendPush,
  notifyExpenseAdded,
  notifyPaymentReceived,
  notifyReminder,
  notifyGroupJoined,
  notifyExpenseDeleted,
  notifyWelcome,
  sendBatchNotifications
};



/**
 * UPI Service - generates UPI deep link URIs for different payment apps
 */

// Generate UPI deep links for all supported payment apps
export const generateUpiLinks = ({ payeeUpiId, payeeName, amount, note, ref }) => {
  console.log(`🔗 [UPI Service] Generating links for ${payeeUpiId}, Amount: ${amount}, Ref: ${ref}`);

  // Build base parameters
  const baseParams = {
    pa: payeeUpiId,           // Payee address (UPI ID)
    pn: payeeName,            // Payee name
    am: amount.toFixed(2),    // Amount (2 decimal places)
    cu: 'INR',                // Currency
    tn: note                  // Transaction note
  };

  // Tracking parameters (These can cause "Bank Limit" errors on some banks)
  const trackingParams = {
    ...baseParams,
    tr: ref                   // Transaction reference
  };

  const params = new URLSearchParams(trackingParams).toString();
  const cleanParams = new URLSearchParams(baseParams).toString();

  // Generic UPI URI (works on most devices)
  const generic = `upi://pay?${cleanParams}`; // Use clean link for generic fallback

  // Android intent URLs for specific apps
  const androidIntents = {
    gpay: `intent://pay?${params}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`,
    paytm: `intent://pay?${params}#Intent;scheme=paytm;package=net.one97.paytm;end`,
    phonepe: `intent://pay?${params}#Intent;scheme=upi;package=com.phonepe.app;end`,
    bhim: `intent://pay?${params}#Intent;scheme=upi;package=in.org.npci.upiapp;end`
  };

  const iosSchemes = {
    gpay: `gpay://upi/pay?${params}`,
    paytm: `paytmmp://pay?${params}`,
    phonepe: `phonepe://pay?${params}`,
    bhim: `bhim://pay?${params}`
  };

  console.log('✅ [UPI Service] Links generated successfully');
  
  // Return all possible links
  return {
    generic,
    clean: `upi://pay?${cleanParams}`, // Added a "Clean" P2P link
    android: androidIntents,
    ios: iosSchemes,
    // For simplicity, return the most common ones
    gpay: androidIntents.gpay,
    paytm: androidIntents.paytm,
    phonepe: androidIntents.phonepe,
    bhim: androidIntents.bhim
  };
};

// Validate UPI ID format
export const validateUpiId = (upiId) => {
  if (!upiId || typeof upiId !== 'string') {
    return false;
  }

  // Basic UPI ID validation: username@provider
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
  return upiRegex.test(upiId);
};

// Extract UPI ID from various formats
export const extractUpiId = (input) => {
  if (!input) return null;

  // Remove whitespace and convert to lowercase
  const cleaned = input.trim().toLowerCase();
  
  // If it's already a valid UPI ID, return it
  if (validateUpiId(cleaned)) {
    return cleaned;
  }

  // Try to extract UPI ID from common patterns
  const upiMatch = cleaned.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+/);
  return upiMatch ? upiMatch[0] : null;
};

// Generate transaction reference
export const generateTransactionRef = (shareId) => {
  return `splitEasy_${shareId}`;
};

// Parse transaction reference
export const parseTransactionRef = (ref) => {
  if (!ref || typeof ref !== 'string') {
    return null;
  }

  const match = ref.match(/^splitEasy_(.+)$/);
  return match ? match[1] : null;
};

// Get supported UPI apps info
export const getSupportedApps = () => {
  return [
    {
      id: 'gpay',
      label: 'Google Pay',
      androidPackage: 'com.google.android.apps.nbu.paisa.user',
      iosScheme: 'gpay',
      icon: '🟢'
    },
    {
      id: 'paytm',
      label: 'Paytm',
      androidPackage: 'net.one97.paytm',
      iosScheme: 'paytmmp',
      icon: '🔵'
    },
    {
      id: 'phonepe',
      label: 'PhonePe',
      androidPackage: 'com.phonepe.app',
      iosScheme: 'phonepe',
      icon: '💜'
    },
    {
      id: 'bhim',
      label: 'BHIM',
      androidPackage: 'in.org.npci.upiapp',
      iosScheme: 'bhim',
      icon: '🇮🇳'
    }
  ];
};


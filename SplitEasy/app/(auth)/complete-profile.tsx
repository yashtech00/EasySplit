import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { completeProfile } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function CompleteProfileScreen() {
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { updateUser } = useAuthStore();

  const handleSubmit = async () => {
    if (!name || name.trim().length < 2) {
      Alert.alert('Invalid Name', 'Please enter your full name');
      return;
    }

    // Validate UPI ID if provided
    if (upiId && !/^[\w.-]+@[\w]+$/.test(upiId)) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI ID (e.g., name@okaxis)');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await completeProfile(name.trim(), upiId || undefined);
      updateUser(updatedUser);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>
            <Ionicons name="wallet-outline" size={20} color={Colors.primary} /> SplitEasy
          </Text>
        </View>

        {/* Hero Image Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroImagePlaceholder}>
            <Ionicons name="people-outline" size={60} color={Colors.primary} />
          </View>
          <View style={styles.badge}>
            <Ionicons name="leaf-outline" size={16} color={Colors.primary} />
            <Text style={styles.badgeText}>Secure & Organic</Text>
          </View>
          <Text style={styles.heroSubtext}>
            Your data is stored with grounded principles.{'\n'}We prioritize privacy and human-centric{'\n'}design in every interaction.
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Setup Profile</Text>
        <Text style={styles.subtitle}>
          Almost there! Just a few more details to get{'\n'}your expenses organized with friends.
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Full Name (Required)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.label}>UPI ID (Optional)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="card-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="name@okaxis"
              placeholderTextColor={Colors.textLight}
              value={upiId}
              onChangeText={setUpiId}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <Text style={styles.hint}>This helps friends settle up with you faster.</Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Saving...' : 'Get Started'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>SPLITEASY • 2024 • ROOTED IN TRUST</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  brand: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  heroImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  heroSubtext: {
    fontSize: 13,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.9,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: -8,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
    letterSpacing: 1,
  },
});

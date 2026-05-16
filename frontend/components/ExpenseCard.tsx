import { YStack, XStack, Text, Card } from 'tamagui';
import { ShoppingBag, Coffee, Car, Film, Utensils, MoreHorizontal } from '@tamagui/lucide-icons';

interface ExpenseCardProps {
  title: string;
  amount: number;
  date: string;
  shareStatus: 'OWES_YOU' | 'YOU_OWE' | 'SETTLED';
  shareAmount: number;
  onPress: () => void;
}

const getIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('auto') || t.includes('cab') || t.includes('uber')) return <Car size={24} color="$blue10" />;
  if (t.includes('lunch') || t.includes('dinner') || t.includes('food')) return <Utensils size={24} color="$orange10" />;
  if (t.includes('coffee')) return <Coffee size={24} color="$brown10" />;
  if (t.includes('movie')) return <Film size={24} color="$purple10" />;
  return <ShoppingBag size={24} color="$gray10" />;
};

export function ExpenseCard({ title, amount, date, shareStatus, shareAmount, onPress }: ExpenseCardProps) {
  const getStatusColor = () => {
    if (shareStatus === 'OWES_YOU') return '$green10';
    if (shareStatus === 'YOU_OWE') return '$red10';
    return '$gray10';
  };

  const getStatusText = () => {
    if (shareStatus === 'OWES_YOU') return `Friend owes you ₹${shareAmount}`;
    if (shareStatus === 'YOU_OWE') return `You owe ₹${shareAmount}`;
    return 'All settled ✅';
  };

  return (
    <Card p="$4" br="$6" elevation={1} bc="$background" onPress={onPress} pressStyle={{ scale: 0.98 }}>
      <XStack jc="space-between" ai="center">
        <XStack gap="$4" f={1}>
          <YStack bc="$gray2" p="$3" br="$5">
            {getIcon(title)}
          </YStack>
          <YStack jc="center">
            <Text fontSize="$5" fontWeight="700">{title}</Text>
            <Text fontSize="$3" color="$gray10">{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          </YStack>
        </XStack>

        <YStack ai="flex-end">
          <Text fontSize="$5" fontWeight="700">₹{amount}</Text>
          <Text fontSize="$2" fontWeight="600" color={getStatusColor()}>
            {getStatusText()}
          </Text>
        </YStack>
      </XStack>
    </Card>
  );
}

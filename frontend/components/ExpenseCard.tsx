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

export default function ExpenseCard({ title, amount, date, shareStatus, shareAmount, onPress }: ExpenseCardProps) {
  const getBadgeStyle = () => {
    if (shareStatus === 'OWES_YOU') {
      return {
        bg: '$green2',
        color: '$green11',
        text: `You get ₹${shareAmount}`,
      };
    }
    if (shareStatus === 'YOU_OWE') {
      return {
        bg: '$red2',
        color: '$red11',
        text: `You owe ₹${shareAmount}`,
      };
    }
    return {
      bg: '$gray2',
      color: '$gray7',
      text: 'Settled ✅',
    };
  };

  const badge = getBadgeStyle();

  return (
    <Card 
      p="$4" 
      br="$8" 
      bw={1}
      boc="$gray3" 
      bc="white" 
      elevation={0}
      onPress={onPress} 
      pressStyle={{ scale: 0.98, bc: '$gray2' }}
      hoverStyle={{ boc: '$blue4' }}
    >
      <XStack jc="space-between" ai="center" gap="$3">
        <XStack gap="$4" f={1} ai="center">
          <YStack bc="$gray2" p="$3.5" br="$9" ai="center" jc="center" width={52} height={52}>
            {getIcon(title)}
          </YStack>
          <YStack jc="center" gap="$1" f={1}>
            <Text fontSize="$4" fontWeight="700" color="$gray12" numberOfLines={1}>{title}</Text>
            <Text fontSize="$2" fontWeight="500" color="$gray6">
              {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          </YStack>
        </XStack>

        <YStack ai="flex-end" gap="$2" jc="center">
          <Text fontSize="$5" fontWeight="800" color="$gray12">₹{amount}</Text>
          <XStack bc={badge.bg} px="$2.5" py="$1" br="$4" ai="center" jc="center">
            <Text fontSize="$1" fontWeight="700" color={badge.color} textTransform="uppercase" letterSpacing={0.5}>
              {badge.text}
            </Text>
          </XStack>
        </YStack>
      </XStack>
    </Card>
  );
}

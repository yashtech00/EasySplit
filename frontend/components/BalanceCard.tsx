import { YStack, XStack, Text, Button, Card, H3 } from 'tamagui';
import { TrendingUp, TrendingDown, RefreshCcw } from '@tamagui/lucide-icons';

interface BalanceCardProps {
  direction: 'THEY_OWE_YOU' | 'YOU_OWE_THEM' | 'SETTLED';
  amount: number;
  personName?: string;
  totalGroupSpend: number;
  onRemind?: () => void;
  onPress?: () => void;
}

export function BalanceCard({ direction, amount, personName, totalGroupSpend, onRemind, onPress }: BalanceCardProps) {
  const isOwed = direction === 'THEY_OWE_YOU';
  const isSettled = direction === 'SETTLED';

  return (
    <Card p="$6" br="$8" elevation={2} bc="$blue1" onPress={onPress} pressStyle={{ scale: 0.98 }}>
      <YStack gap="$4">
        <XStack jc="space-between" ai="center">
          <XStack ai="center" gap="$2">
            <YStack bc="$blue4" p="$2" br="$4">
              <TrendingUp size={20} color="$blue10" />
            </YStack>
            <H3 size="$5" fontWeight="700">Overall Balance</H3>
          </XStack>
          <Text color="$gray10" fontSize="$3">Total Spend: ₹{totalGroupSpend}</Text>
        </XStack>

        <YStack ai="center" py="$2">
          {isSettled ? (
            <Text fontSize="$6" fontWeight="700" color="$gray10">All settled! ✅</Text>
          ) : (
            <>
              <Text fontSize="$4" color="$gray11">
                {isOwed ? `${personName} owes you:` : `You owe ${personName}:`}
              </Text>
              <Text fontSize="$9" fontWeight="800" color={isOwed ? '$green10' : '$red10'}>
                ₹{amount}
              </Text>
            </>
          )}
        </YStack>

        {!isSettled && isOwed && (
          <Button
            size="$3"
            bc="$blue10"
            onPress={onRemind}
            icon={<RefreshCcw size={16} color="white" />}
          >
            <Text color="white" fontWeight="600">Remind</Text>
          </Button>
        )}
      </YStack>
    </Card>
  );
}

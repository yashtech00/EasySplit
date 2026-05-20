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

  const getCardStyle = () => {
    if (isSettled) {
      return {
        borderColor: '$gray4',
        accentColor: '$gray10',
        icon: <TrendingUp size={20} color="$gray10" />,
        iconBg: '$gray2',
      };
    }
    if (isOwed) {
      return {
        borderColor: '$green6',
        accentColor: '$green10',
        icon: <TrendingUp size={20} color="$green10" />,
        iconBg: '$green2',
      };
    }
    return {
      borderColor: '$red6',
      accentColor: '$red10',
      icon: <TrendingDown size={20} color="$red10" />,
      iconBg: '$red2',
    };
  };

  const style = getCardStyle();

  return (
    <Card 
      p="$5" 
      br="$8" 
      bw={1}
      boc="$gray3" 
      bc="white" 
      elevation={0}
      pressStyle={{ scale: 0.99 }}
      style={{
        borderLeftWidth: 6,
        borderLeftColor: style.borderColor,
      }}
      onPress={onPress}
    >
      <YStack gap="$4">
        <XStack jc="space-between" ai="center">
          <XStack ai="center" gap="$2">
            <YStack bc={style.iconBg} p="$2" br="$5">
              {style.icon}
            </YStack>
            <H3 size="$4" fontWeight="800" color="$gray12" textTransform="uppercase" letterSpacing={0.5}>
              Overall Balance
            </H3>
          </XStack>
          <XStack bc="$gray2" px="$2.5" py="$1" br="$4">
            <Text color="$gray10" fontSize="$2" fontWeight="700">TOTAL SPEND: ₹{totalGroupSpend}</Text>
          </XStack>
        </XStack>

        <YStack py="$1">
          {isSettled ? (
            <YStack ai="flex-start" gap="$1">
              <Text fontSize="$6" fontWeight="800" color="$gray12">All settled! ✨</Text>
              <Text fontSize="$2" color="$gray8" fontWeight="500">No pending expenses between you two.</Text>
            </YStack>
          ) : (
            <YStack ai="flex-start" gap="$1">
              <Text fontSize="$2.5" fontWeight="700" color="$gray6" textTransform="uppercase" letterSpacing={0.5}>
                {isOwed ? `${personName} owes you` : `You owe ${personName}`}
              </Text>
              <Text fontSize="$9" fontWeight="900" color={style.accentColor} letterSpacing={-1}>
                ₹{amount}
              </Text>
            </YStack>
          )}
        </YStack>

        {!isSettled && isOwed && (
          <Button
            size="$4"
            bc="$blue10"
            hoverStyle={{ bc: '$blue11' }}
            pressStyle={{ bc: '$blue9', scale: 0.97 }}
            onPress={onRemind}
            br="$9"
            icon={<RefreshCcw size={16} color="white" />}
          >
            <Text color="white" fontWeight="700" letterSpacing={0.5}>SEND PAYMENT REMINDER</Text>
          </Button>
        )}
      </YStack>
    </Card>
  );
}

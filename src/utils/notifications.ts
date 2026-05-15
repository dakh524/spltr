import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const QUOTES = [
  "Early bird gets the bag. Time to earn! 💰",
  "Don't stay in bed unless you can make money in bed. ⚡",
  "Your bank account is waiting for your next move. 💹",
  "Hustle until your haters ask if you're hiring. 🔥",
  "The goal isn't more money, it's more freedom. 🕊️",
  "Opportunity doesn't knock, it presents itself when you beat down the door. 🔨",
  "Wealth is the ability to fully experience life. 🌟",
  "Today is a good day to make some 0s behind your 1s. 💸",
];

export async function requestPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function scheduleMorningQuote() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Rise & Grind ⚡",
      body: quote,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });
}

export async function cancelNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

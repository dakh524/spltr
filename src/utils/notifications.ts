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
  "Stop chasing the money and start chasing the freedom. 🦅",
  "Consistency is the only thing that beats luck. Keep grinding! ⛓️",
  "Your future self is thanking you for the work you're doing today. 🏆",
  "Success is not owned, it is leased. And rent is due every day. 📅",
  "Make your money work for you, so you don't have to work for it. 🏦",
  "The best way to predict the future is to create it. 🛠️",
  "A year from now, you'll wish you started today. ⏰",
  "Don't talk, just act. Don't say, just show. Don't promise, just prove. 🦾",
  "The only limit to your impact is your imagination and commitment. 🌌",
  "Winners focus on winning. Losers focus on winners. Stay focused! 🎯",
  "Comfort is the enemy of progress. Get uncomfortable today. 🧗",
  "Dream big, work hard, stay humble, and stack that paper. 📚",
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

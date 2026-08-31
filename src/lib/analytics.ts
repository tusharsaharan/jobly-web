export function trackWeaknessAction(weaknessId: string, topic: string, action: string, source: string = 'hero') {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'weakness_interaction', {
      weakness_id: weaknessId,
      topic,
      action,
      source
    });
  } else {
    console.log(`[Analytics] weakness_interaction: ${action} on ${topic} (${weaknessId}) from ${source}`);
  }
}

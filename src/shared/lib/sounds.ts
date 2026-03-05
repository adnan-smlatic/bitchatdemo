'use client';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

let audioElement: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
	if (!audioElement) {
		audioElement = new Audio(`${basePath}/sounds/notification.wav`);
		audioElement.volume = 0.5;
	}
	return audioElement;
}

export function playNotification(): void {
	try {
		const audio = getAudio();
		audio.currentTime = 0;
		audio.play().catch(() => {
			// Browser may block autoplay until user interaction
		});
	} catch {
		// Audio not available
	}
}

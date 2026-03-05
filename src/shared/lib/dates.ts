import {
	format,
	formatDistanceToNow,
	isToday,
	isYesterday,
	parseISO,
} from 'date-fns';

export function formatMessageTime(isoString: string): string {
	const date = parseISO(isoString);

	if (isToday(date)) {
		return format(date, 'HH:mm');
	}

	if (isYesterday(date)) {
		return `Yesterday ${format(date, 'HH:mm')}`;
	}

	return format(date, 'dd MMM HH:mm');
}

export function formatRelativeDate(isoString: string): string {
	const date = parseISO(isoString);
	return formatDistanceToNow(date, { addSuffix: true });
}

export function formatInboxTime(isoString: string): string {
	const date = parseISO(isoString);

	if (isToday(date)) {
		return format(date, 'HH:mm');
	}

	if (isYesterday(date)) {
		return 'Yesterday';
	}

	return format(date, 'dd MMM');
}

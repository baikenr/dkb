import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotificationStore = defineStore('notifications', () => {
	const notifications = ref([]);

	const showNotification = (notification) => {
		notifications.value.push(notification);
		setTimeout(() => {
			notifications.value = [];
		}, 5000);
	};

	return {
		notifications,
		showNotification,
	};
});

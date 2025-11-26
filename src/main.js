import App from './App.vue'
import router from './router/index';
import "@/styles/style.scss";

import { createApp } from 'vue'
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';

const savedLanguage = sessionStorage.getItem('lang') || 'de';

import en from '@/locales/en.json';
import de from '@/locales/de.json';

const messages = {
	de,
	en,
};

const i18n = createI18n({
	legacy: false,
	locale: savedLanguage,
	fallbackLocale: 'ru',
	messages,
});

// Vuetify
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { VDateInput } from 'vuetify/labs/VDateInput';
import * as directives from 'vuetify/directives';
import { ru as vuetifyRu, en as vuetifyEn } from 'vuetify/locale';  // локализация для Vuetify

const vuetify = createVuetify({
	components: {
		VDateInput,
	},
	directives,
	icons: {
		defaultSet: 'mdi',
	},
	locale: {
		locale: savedLanguage == 'de' ? 'de' : 'en',
		fallback: 'de',
		messages: {
			ru: vuetifyRu,
			en: vuetifyEn,
			kk: vuetifyRu
		},
	},
});

const app = createApp(App);
const pinia = createPinia();

app.use(pinia).use(router).use(vuetify).use(i18n);
app.mount('#app');

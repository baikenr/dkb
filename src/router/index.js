import { createRouter, createWebHistory } from 'vue-router'

const routes = [
	{
		path: '/',
		name: 'Main',
		meta: { public: true },
		component: () => import('@/pages/Index.vue')
	}
]

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes
})

router.beforeEach((to, from, next) => {
	const isAuthenticated = !!sessionStorage.getItem('token');

	if (to.meta.public) {
		next();
	} 
	else if (isAuthenticated) {
		next();
	} 
	else {
		next({ path: '/login', query: { redirect: to.fullPath } });
	}
});

export default router

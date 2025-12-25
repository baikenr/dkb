import { createRouter, createWebHistory } from 'vue-router'

const routes = [
	{
	path: '/login',
	name: 'login',
	component: () => import('@/components/Login.vue'),
	meta: { public: true },
	},
	{
		path: '/',
		name: 'Main',
		// meta: { public: true },
		component: () => import('@/pages/Index.vue')
	},
	{
    path: "/profile",
    name: "Profile",
    component: () => import("@/components/Profile.vue"),
  },
]

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes
})

router.beforeEach((to, from, next) => {
	console.log("NAVIGATE TO:", to.fullPath)
  const token = sessionStorage.getItem('access')
  const isPublic = Boolean(to.meta.public)

  if (!token && !isPublic) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (token && to.path === '/login') {
    return next({ path: '/' })
  }

  next()
})

export default router
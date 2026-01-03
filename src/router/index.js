import { createRouter, createWebHistory } from 'vue-router'

const routes = [
	{
	path: '/login',
	name: 'login',
	component: () => import('@/components/Login.vue'),
	meta: { public: true },
	},
	{
	path: '/forgot-password',
	name: 'ForgotPassword',
	component: () => import('@/components/ForgotPassword.vue'),
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
	{
    path: "/security",
    name: "Security",
    component: () => import("@/pages/Index.vue"),
  },
	// Staff routes
	{
		path: '/staff',
		name: 'StaffMain',
		component: () => import('@/pages/Index.vue'),
	},
	{
		path: '/staff/clients',
		name: 'StaffClients',
		component: () => import('@/pages/Index.vue'),
	},
	{
		path: '/staff/card-requests',
		name: 'StaffCardRequests',
		component: () => import('@/pages/Index.vue'),
	},
	{
		path: '/staff/users',
		name: 'StaffUsers',
		component: () => import('@/pages/Index.vue'),
		meta: { requiresAdmin: true },
	},
	{
		path: '/staff/faq',
		name: 'StaffFAQ',
		component: () => import('@/pages/Index.vue'),
	},
	// Client routes
	{
		path: '/card',
		name: 'ClientCard',
		component: () => import('@/pages/Index.vue'),
	},
	{
		path: '/document',
		name: 'ClientDocument',
		component: () => import('@/pages/Index.vue'),
	},
	{
		path: '/messages',
		name: 'ClientMessages',
		component: () => import('@/pages/Index.vue'),
	},
	{
		path: '/faq',
		name: 'ClientFAQ',
		component: () => import('@/pages/Index.vue'),
	},
	{
		path: '/account-details',
		name: 'AccountDetails',
		component: () => import('@/components/AccountDetails.vue'),
	},
]

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes
})

router.beforeEach((to, from, next) => {
	console.log("NAVIGATE TO:", to.fullPath)
  const token = sessionStorage.getItem('access')
  const authType = sessionStorage.getItem('authType')
  const staffRole = sessionStorage.getItem('staffRole')
  const isPublic = Boolean(to.meta.public)
  const requiresAdmin = Boolean(to.meta.requiresAdmin)

  if (!token && !isPublic) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (token && to.path === '/login') {
    // Redirect based on auth type
    if (authType === 'staff') {
      return next({ path: '/staff' })
    }
    return next({ path: '/' })
  }

  // Redirect staff users from root to /staff
  if (token && authType === 'staff' && to.path === '/') {
    return next({ path: '/staff' })
  }

  // Redirect client users from /staff to /
  if (token && authType === 'client' && to.path.startsWith('/staff')) {
    return next({ path: '/' })
  }

  // Check admin access for admin-only routes
  if (token && requiresAdmin && staffRole !== 'admin') {
    return next({ path: '/staff' })
  }

  next()
})

export default router
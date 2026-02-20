const redirects = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  // Redirect /news to /blog (news route doesn't exist, redirect to blog)
  const newsToBlogRedirect = {
    source: '/news',
    destination: '/blog',
    permanent: true, // 308 permanent redirect for SEO
  }

  // Legacy form URLs → current /services/*/request routes (Phase 6 smoke-check / guide alignment)
  const legacyFormRedirects = [
    { source: '/request-mediation-self-referral', destination: '/services/mediation/request', permanent: true },
    { source: '/restorative-program-referral', destination: '/services/restorative-justice/request', permanent: true },
    { source: '/group-facilitation-inquiry', destination: '/services/facilitation/request', permanent: true },
    { source: '/community-education-training-request', destination: '/services/training/request', permanent: true },
  ]

  const redirects = [internetExplorerRedirect, newsToBlogRedirect, ...legacyFormRedirects]

  return redirects
}

export default redirects

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

  const redirects = [internetExplorerRedirect, newsToBlogRedirect]

  return redirects
}

export default redirects

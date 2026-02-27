// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.greenkube.cloud',
	integrations: [
		starlight({
			title: 'GreenKube',
			description: 'Measure, understand, and reduce the carbon footprint of your Kubernetes infrastructure. Open-source FinGreenOps monitoring for cost and CO₂ optimization.',
			logo: {
				src: './src/assets/greenkube-logo.png',
				replacesTitle: false,
			},
			components: {
				Header: './src/components/Header.astro',
				Footer: './src/components/Footer.astro',
				ThemeSelect: './src/components/ThemeSelect.astro',
			},
			social: [],
			head: [
				{
					tag: 'meta',
					attrs: { name: 'keywords', content: 'kubernetes, carbon footprint, CO2, FinOps, GreenOps, sustainability, CSRD, cloud optimization, cost reduction, open source, helm chart, monitoring' },
				},
				{
					tag: 'meta',
					attrs: { property: 'og:image', content: 'https://www.greenkube.cloud/og-image.png' },
				},
				{
					tag: 'meta',
					attrs: { property: 'og:type', content: 'website' },
				},
				{
					tag: 'meta',
					attrs: { name: 'twitter:card', content: 'summary_large_image' },
				},
				{
					tag: 'link',
					attrs: { rel: 'canonical', href: 'https://www.greenkube.cloud' },
				},
				{
					tag: 'script',
					attrs: { type: 'application/ld+json' },
					content: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'SoftwareApplication',
						name: 'GreenKube',
						applicationCategory: 'DeveloperApplication',
						operatingSystem: 'Kubernetes',
						description: 'Open-source FinGreenOps tool to measure, understand, and reduce the carbon footprint of Kubernetes infrastructure.',
						url: 'https://www.greenkube.cloud',
						license: 'https://opensource.org/licenses/Apache-2.0',
						author: {
							'@type': 'Organization',
							name: 'GreenKube Cloud',
							url: 'https://github.com/GreenKubeCloud',
						},
						offers: {
							'@type': 'Offer',
							price: '0',
							priceCurrency: 'USD',
						},
					}),
				},
			],
			editLink: {
				baseUrl: 'https://github.com/GreenKubeCloud/greenkube-website/edit/main/',
			},
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: 'Home',
					link: '/',
				},
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Quick Start', slug: 'getting-started/quickstart' },
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Configuration', slug: 'getting-started/configuration' },
					],
				},
				{
					label: 'User Guide',
					items: [
						{ label: 'Dashboard', slug: 'guide/dashboard' },
						{ label: 'CLI Reference', slug: 'guide/cli' },
						{ label: 'API Reference', slug: 'guide/api' },
						{ label: 'Reports & Exports', slug: 'guide/reports' },
						{ label: 'Recommendations', slug: 'guide/recommendations' },
					],
				},
				{
					label: 'Architecture',
					items: [
						{ label: 'Overview', slug: 'architecture/overview' },
						{ label: 'Data Pipeline', slug: 'architecture/data-pipeline' },
						{ label: 'Energy Estimation', slug: 'architecture/energy-estimation' },
						{ label: 'Storage Backends', slug: 'architecture/storage' },
					],
				},
				{
					label: 'Releases',
					slug: 'releases',
				},
				{
					label: 'Contributing',
					slug: 'contributing',
				},
				{
					label: 'Contact',
					slug: 'contact',
				},
			],
			lastUpdated: true,
			pagination: true,
		}),
		sitemap(),
		tailwind({ applyBaseStyles: false }),
	],
});

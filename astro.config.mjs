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
			favicon: '/favicon.ico',
			components: {
				Header: './src/components/Header.astro',
				Footer: './src/components/Footer.astro',
				ThemeSelect: './src/components/ThemeSelect.astro',
			},
			social: [],
			head: [
				{
					tag: 'meta',
					attrs: { name: 'keywords', content: 'kubernetes carbon footprint, kubernetes CO2, FinOps, GreenOps, FinGreenOps, sustainability, CSRD, ESRS E1, cloud carbon monitoring, cloud cost optimization, open source, helm chart, prometheus, kubernetes monitoring, green kubernetes, carbon aware scheduling' },
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
					attrs: { property: 'og:site_name', content: 'GreenKube' },
				},
				{
					tag: 'meta',
					attrs: { name: 'twitter:card', content: 'summary_large_image' },
				},
				{
					tag: 'meta',
					attrs: { name: 'twitter:image', content: 'https://www.greenkube.cloud/og-image.png' },
				},
				{
					tag: 'link',
					attrs: { rel: 'canonical', href: 'https://www.greenkube.cloud' },
				},
				// LLM/AI crawler guidance (llms.txt convention)
				{
					tag: 'link',
					attrs: { rel: 'alternate', type: 'text/plain', href: 'https://www.greenkube.cloud/llms.txt', title: 'LLM-readable project description' },
				},
				{
					tag: 'script',
					attrs: { type: 'application/ld+json' },
					content: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'SoftwareApplication',
						name: 'GreenKube',
						alternateName: 'GreenKube FinGreenOps',
						applicationCategory: 'DeveloperApplication',
						applicationSubCategory: 'Monitoring, FinOps, GreenOps, Sustainability',
						operatingSystem: 'Kubernetes',
						description: 'Open-source FinGreenOps platform for Kubernetes. Measure CO₂e emissions, energy usage, and cloud costs per pod and namespace. CSRD/ESRS E1 reporting ready. Deploy in minutes with a single Helm command.',
						url: 'https://www.greenkube.cloud',
						downloadUrl: 'https://hub.docker.com/r/greenkube/greenkube',
						releaseNotes: 'https://www.greenkube.cloud/docs/releases/',
						softwareVersion: '0.3.0',
						datePublished: '2026-08-30',
						license: 'https://opensource.org/licenses/Apache-2.0',
						keywords: 'kubernetes, carbon footprint, CO2, FinOps, GreenOps, CSRD, ESRS, sustainability, cloud cost, prometheus, helm',
						featureList: [
							'Real-time CO₂e and energy monitoring per pod and namespace',
							'Cloud cost tracking via OpenCost integration',
							'Sustainability Score (0–100) across 7 dimensions',
							'Smart recommendations: zombie pods, rightsizing, autoscaling, orphaned volumes/load balancers',
							'CSRD/ESRS E1 compliance reporting',
							'Multi-cloud support: AWS, GCP, Azure, OVH, Scaleway',
							'Grafana dashboard and Prometheus metrics',
							'Single Helm chart deployment',
							'Historical analysis with CSV/JSON export',
						],
						author: {
							'@type': 'Organization',
							name: 'GreenKube Cloud',
							url: 'https://github.com/GreenKubeCloud',
							email: 'hugo.lelievre@greenkube.cloud',
						},
						offers: {
							'@type': 'Offer',
							price: '0',
							priceCurrency: 'USD',
						},
						sameAs: [
							'https://github.com/GreenKubeCloud/GreenKube',
							'https://hub.docker.com/r/greenkube/greenkube',
							'https://artifacthub.io/packages/helm/greenkube/greenkube',
						],
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
					label: 'Features',
					items: [
						{ label: 'Real-time Dashboard', slug: 'features/real-time-dashboard' },
						{ label: 'Carbon Tracking', slug: 'features/carbon-tracking' },
						{ label: 'Cost Optimization', slug: 'features/cost-optimization' },
						{ label: 'Easy Deployment', slug: 'features/easy-deployment' },
						{ label: 'Multi-Resource Monitoring', slug: 'features/multi-resource-monitoring' },
						{ label: 'Smart Recommendations', slug: 'features/smart-recommendations' },
						{ label: 'Flexible Storage', slug: 'features/flexible-storage' },
						{ label: 'Multi-Cloud Support', slug: 'features/multi-cloud-support' },
						{ label: 'Historical Analysis', slug: 'features/historical-analysis' },
						{ label: 'REST API', slug: 'features/rest-api' },
					],
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
						{ label: 'Grafana & Prometheus', slug: 'guide/grafana' },
						{ label: 'Reports & Exports', slug: 'guide/reports' },
						{ label: 'Recommendations', slug: 'guide/recommendations' },
						{ label: 'Wattnet Provider', slug: 'guide/wattnet' },
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

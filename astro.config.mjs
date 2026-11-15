// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.greenkube.cloud',
	integrations: [
		starlight({
			title: 'GreenKube',
			description: 'GreenKube is an open-source optimization loop for Kubernetes run with GitOps: aggregate recommendations, open one pull request, verify the sync and measure realized savings in money, CO₂e and released capacity.',
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
					attrs: { name: 'keywords', content: 'kubernetes optimization, kubernetes rightsizing, gitops, argo cd, flux, pull request, finops, greenops, kubernetes co2, savings measurement, vpa, goldilocks, krr, kubecost, karpenter, open source, helm chart' },
				},
				{
					tag: 'meta',
					attrs: { property: 'og:image', content: 'https://greenkube.cloud/og-image.png' },
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
					attrs: { name: 'twitter:image', content: 'https://greenkube.cloud/og-image.png' },
				},
				// LLM/AI crawler guidance (llms.txt convention)
				{
					tag: 'link',
					attrs: { rel: 'alternate', type: 'text/plain', href: 'https://docs.greenkube.cloud/llms.txt', title: 'LLM-readable project description' },
				},
				{
					tag: 'script',
					attrs: { type: 'application/ld+json' },
					content: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'SoftwareApplication',
						name: 'GreenKube',
						alternateName: 'GreenKube optimization loop',
						applicationCategory: 'DeveloperApplication',
						applicationSubCategory: 'Kubernetes optimization, GitOps, FinOps, GreenOps',
						operatingSystem: 'Kubernetes',
								description: 'Open-source optimization loop for Kubernetes run with GitOps: aggregate recommendations from many sources, cross-analyse value and risk, open one-click pull requests for Argo CD or Flux, verify the sync and measure realized savings against a counterfactual in an append-only ledger.',
						url: 'https://docs.greenkube.cloud',
						downloadUrl: 'https://hub.docker.com/r/greenkube/greenkube',
						releaseNotes: 'https://docs.greenkube.cloud/releases/',
						datePublished: '2026-08-30',
						license: 'https://opensource.org/licenses/Apache-2.0',
								keywords: 'kubernetes, gitops, argo cd, flux, rightsizing, finops, greenops, co2e, savings measurement, helm',
						featureList: [
							'Aggregates recommendations from GreenKube analyzers, VPA, Goldilocks, KRR, Kubecost, Polaris, GKE recommender, Azure Advisor, Karpenter NodePools and a push API',
							'Consensus across sources, with value, risk and confidence for every recommendation',
							'One-click pull requests to the GitOps repository (Argo CD or Flux), approved by digest',
							'Sync tracking and apply detection',
							'Savings measured against a counterfactual with a 90% confidence interval',
							'Money, CO₂e and released capacity (CPU cores and memory) reported separately',
							'Append-only, hash-chained savings ledger with CSV and FOCUS-aligned exports',
							'Works on-premises and on AWS, GCP, Azure, OVHcloud and Scaleway',
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
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Quick Start', slug: 'getting-started/quickstart' },
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Configuration', slug: 'getting-started/configuration' },
					],
				},
				{
					label: 'Concepts',
					items: [
						{ label: 'The Optimization Loop', slug: 'concepts/loop' },
						{ label: 'Recommendations', slug: 'concepts/recommendations' },
						{ label: 'GitOps Delivery', slug: 'concepts/gitops-delivery' },
						{ label: 'Measurements & Ledger', slug: 'concepts/measurements-and-ledger' },
						{ label: 'Released Capacity', slug: 'concepts/released-capacity' },
					],
				},
				{
					label: 'Sources',
					items: [
						{ label: 'Overview', slug: 'sources/overview' },
						{ label: 'VPA & Goldilocks', slug: 'sources/vpa-goldilocks' },
						{ label: 'Robusta KRR', slug: 'sources/krr' },
						{ label: 'Kubecost', slug: 'sources/kubecost' },
						{ label: 'Fairwinds Polaris', slug: 'sources/polaris' },
						{ label: 'GKE Recommender', slug: 'sources/gke' },
						{ label: 'Azure Advisor', slug: 'sources/azure-advisor' },
						{ label: 'Karpenter & NodePools', slug: 'sources/nodepool' },
						{ label: 'Push API', slug: 'sources/push' },
					],
				},
				{
					label: 'Methodology',
					items: [
						{ label: 'Savings Measurement', slug: 'methodology/savings-measurement' },
						{ label: 'Impact Model', slug: 'methodology/impact-model' },
						{ label: 'Limitations', slug: 'methodology/limitations' },
					],
				},
				{
					label: 'Operations',
					items: [
						{ label: 'Backup & Restore', slug: 'operations/backup-restore' },
						{ label: 'Alerts & SLOs', slug: 'operations/alerts' },
						{ label: 'Upgrading', slug: 'operations/upgrading' },
						{ label: 'Prometheus & Grafana', slug: 'guide/grafana' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Web UI', slug: 'guide/dashboard' },
						{ label: 'API', slug: 'guide/api' },
						{ label: 'CLI', slug: 'guide/cli' },
						{ label: 'Architecture', slug: 'architecture/overview' },
						{ label: 'Wattnet Provider', slug: 'guide/wattnet' },
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

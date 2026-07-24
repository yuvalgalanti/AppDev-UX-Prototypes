import React, { useState, useEffect } from 'react'
import {
  Page,
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  PageSection,
  Title,
  Content,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  Gallery,
  Badge,
  Button,
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  EmptyStateFooter,
  Flex,
  FlexItem,
  Label,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core'
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon'
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon'
import StarIcon from '@patternfly/react-icons/dist/esm/icons/star-icon'
import { prototypes, allProducts, Prototype, Product, PrototypeTagColor } from './prototypes'

type LabelColor = PrototypeTagColor

const AI_SKILL_FILTER = 'AI skill' as const

const productColorMap: Record<Product, LabelColor> = {
  'RHDH': 'purple',
  'MTA': 'teal',
  'Konflux': 'orange',
  'TPA': 'blue',
  'TAS': 'green',
  'Podman Desktop': 'red',
  'RHCL': 'orangered',
  'DevSpaces': 'grey',
  'Tekton': 'teal',
  'OpenShift Pipelines': 'blue',
  'AI skill': 'yellow',
}

const colorCssMap: Record<LabelColor, string> = {
  blue: 'var(--pf-t--global--color--nonstatus--blue--default)',
  green: 'var(--pf-t--global--color--nonstatus--green--default)',
  orange: 'var(--pf-t--global--color--nonstatus--orange--default)',
  red: 'var(--pf-t--global--color--nonstatus--red--default)',
  purple: 'var(--pf-t--global--color--nonstatus--purple--default)',
  teal: 'var(--pf-t--global--color--nonstatus--teal--default)',
  yellow: 'var(--pf-t--global--color--nonstatus--yellow--default)',
  grey: 'var(--pf-t--global--text--color--subtle)',
  orangered: 'var(--pf-t--global--color--nonstatus--orangered--default)',
}

function aiSkillLabelIcon(label: string): React.ReactNode | undefined {
  return label === AI_SKILL_FILTER ? <StarIcon /> : undefined
}

function productColor(product: Product): LabelColor {
  return productColorMap[product]
}

function statusColor(status: Prototype['status']) {
  switch (status) {
    case 'Active': return { backgroundColor: 'var(--pf-t--global--color--nonstatus--green--default)', color: 'white' }
    case 'In Progress': return { backgroundColor: 'var(--pf-t--global--color--nonstatus--blue--default)', color: 'white' }
    case 'Planned': return { backgroundColor: 'var(--pf-t--global--color--nonstatus--gray--default)', color: 'white' }
  }
}

function toSlug(product: Product | 'All'): string {
  return product.replace(/\s+/g, '-')
}

function fromSlug(slug: string): Product | 'All' {
  if (!slug || slug.toLowerCase() === 'all') return 'All'
  if (slug.toLowerCase() === 'appdev-ai-skills' || slug.toLowerCase() === 'ai-skills') return AI_SKILL_FILTER
  const match = allProducts.find((p) => toSlug(p).toLowerCase() === slug.toLowerCase())
  return match ?? 'All'
}

function isAiSkill(proto: Prototype): boolean {
  return proto.product === AI_SKILL_FILTER || proto.project === 'Cursor & Claude Code Agent Skills'
}

function matchesProductFilter(proto: Prototype, selected: Product): boolean {
  if (selected === AI_SKILL_FILTER) return isAiSkill(proto)
  if (proto.product === selected) return true
  return proto.tags?.some((tag) => tag.label === selected) === true
}

function getProductFromPath(): Product | 'All' {
  const basePath = '/AppDev-UX-Prototypes/'

  const params = new URLSearchParams(window.location.search)
  const redirectPath = params.get('p')
  if (redirectPath) {
    const cleaned = redirectPath.replace(/\/$/, '')
    const match = fromSlug(cleaned)
    if (match !== 'All') {
      window.history.replaceState(null, '', `${basePath}${toSlug(match)}`)
      return match
    }
    window.history.replaceState(null, '', basePath)
    return 'All'
  }

  const path = window.location.pathname.replace(basePath, '').replace(/\/$/, '')
  if (!path) return 'All'
  return fromSlug(path)
}

export function App() {
  const [selectedProduct, setSelectedProduct] = useState<Product | 'All'>(getProductFromPath)

  useEffect(() => {
    const basePath = '/AppDev-UX-Prototypes/'
    const newPath = selectedProduct === 'All' ? basePath : `${basePath}${toSlug(selectedProduct)}`
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath)
    }
  }, [selectedProduct])

  useEffect(() => {
    const handlePopState = () => setSelectedProduct(getProductFromPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const filtered = selectedProduct === 'All'
    ? [...prototypes].sort((a, b) => a.name.localeCompare(b.name))
    : prototypes.filter((p) => matchesProductFilter(p, selectedProduct))

  const masthead = (
    <Masthead style={{ backgroundColor: 'var(--pf-t--global--background--color--primary--default)' }}>
      <MastheadMain>
        <MastheadBrand>
          <Title headingLevel="h4" style={{ color: 'var(--pf-t--global--text--color--regular)' }}>AppDev UX Prototypes</Title>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <span />
      </MastheadContent>
    </Masthead>
  )

  return (
    <Page masthead={masthead}>
      <PageSection>
        <Title headingLevel="h1" style={{ color: 'var(--pf-t--global--text--color--regular)' }}>
          Prototypes
        </Title>

        <div className="product-filter-bar">
          <span className="product-filter-bar__label">Filter by product:</span>
          <ToggleGroup aria-label="Filter by product" className="product-filter-toggle-group">
            <ToggleGroupItem
              text="All"
              isSelected={selectedProduct === 'All'}
              onChange={() => setSelectedProduct('All')}
            />
            {allProducts.map((product) => (
              <ToggleGroupItem
                key={product}
                text={
                  <span className="product-filter-toggle-text">
                    {product === AI_SKILL_FILTER ? (
                      <StarIcon
                        style={{
                          color: colorCssMap.yellow,
                          flexShrink: 0,
                          width: 10,
                          height: 10,
                          fontSize: 10,
                        }}
                      />
                    ) : (
                      <span style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: colorCssMap[productColorMap[product]],
                        flexShrink: 0,
                      }} />
                    )}
                    {product}
                  </span>
                }
                isSelected={selectedProduct === product}
                onChange={() => setSelectedProduct(product)}
              />
            ))}
          </ToggleGroup>
        </div>
        {filtered.length === 0 ? (
          <Bullseye style={{ minHeight: 320, marginTop: 'var(--pf-t--global--spacer--xl)' }}>
            <EmptyState headingLevel="h2" icon={SearchIcon} titleText="No prototypes found">
              <EmptyStateBody>
                No prototypes match the <strong>{selectedProduct}</strong> filter. Try selecting a
                different product or view all prototypes.
              </EmptyStateBody>
              <EmptyStateFooter>
                <EmptyStateActions>
                  <Button variant="primary" onClick={() => setSelectedProduct('All')}>
                    View all prototypes
                  </Button>
                </EmptyStateActions>
              </EmptyStateFooter>
            </EmptyState>
          </Bullseye>
        ) : (
        <Gallery hasGutter minWidths={{ default: '300px' }}>
          {filtered.map((proto) => (
            <Card key={proto.name} isFullHeight>
              <CardHeader>
                <CardTitle>{proto.name}</CardTitle>
              </CardHeader>
              <CardBody>
                <Flex
                  className="prototype-card-tags"
                  alignItems={{ default: 'alignItemsCenter' }}
                  style={{ marginBottom: 12, flexWrap: 'nowrap' }}
                >
                  <Label
                    color={productColor(proto.product)}
                    isCompact
                    icon={aiSkillLabelIcon(proto.product)}
                  >
                    {proto.product}
                  </Label>
                  {proto.tags?.map((tag) => (
                    <Label
                      key={tag.label}
                      color={tag.color}
                      isCompact
                      icon={tag.icon === 'stars' || tag.label === AI_SKILL_FILTER ? <StarIcon /> : undefined}
                    >
                      {tag.label}
                    </Label>
                  ))}
                </Flex>
                <Content component="p" style={{ fontWeight: 600, marginBottom: 8 }}>
                  {proto.project}
                </Content>
                <Content component="p">{proto.description}</Content>
              </CardBody>
              <CardFooter>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                  <Button
                    variant="secondary"
                    isDisabled={proto.disabled}
                    {...(proto.disabled ? {} : {
                      component: 'a',
                      href: proto.externalUrl || proto.path,
                      target: proto.externalUrl ? '_blank' : undefined,
                      rel: proto.externalUrl ? 'noopener noreferrer' : undefined,
                    })}
                    icon={<ExternalLinkAltIcon />}
                    iconPosition="end"
                  >
                    {proto.buttonLabel ?? (proto.externalUrl ? 'Launch prototype (VPN required)' : 'Launch prototype')}
                  </Button>
                  <Content component="small" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
                    Last updated: {proto.lastUpdated}
                  </Content>
                </Flex>
              </CardFooter>
            </Card>
          ))}
        </Gallery>
        )}
      </PageSection>
    </Page>
  )
}

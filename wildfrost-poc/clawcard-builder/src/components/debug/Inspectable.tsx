import type { ReactNode } from 'react'

export interface InspectMeta {
  componentName: string
  objectType: string
  codeRef: string
  description: string
}

interface InspectableProps {
  meta: InspectMeta
  children: ReactNode
}

/**
 * Oznacza fragment UI metadanymi do podgladu developerskiego.
 *
 * Wrapper nie zmienia logiki dzieci. Dodaje jedynie atrybuty danych, ktore
 * tooltip developerski moze odczytac na hover.
 *
 * @param props - Metadane obiektu i zawartosc renderowana wewnatrz wrappera.
 * @returns Kontener z atrybutami wykorzystywanymi przez dev hover.
 */
export function Inspectable({ meta, children }: InspectableProps) {
  return (
    <div
      className="inspectable"
      data-inspectable="true"
      data-component-name={meta.componentName}
      data-object-type={meta.objectType}
      data-code-ref={meta.codeRef}
      data-description={meta.description}
    >
      {children}
    </div>
  )
}

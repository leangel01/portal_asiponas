export type CrudResource =
  | "asiponas"
  | "directory_contacts"
  | "locations"
  | "news"
  | "goals"
  | "contracts"
  | "investment_projects"
  | "budget_items";

export type CrudField = {
  name: string;
  label: string;
  type?: "number" | "select" | "date";
  options?: string[];
  required?: boolean;
};

export const resourceByModule: Record<string, CrudResource | undefined> = {
  Directorio: "directory_contacts",
  Recintos: "locations",
  Prensa: "news",
  Metas: "goals",
  Contratos: "contracts",
  Inversiones: "investment_projects",
};

export const fieldsByResource: Record<CrudResource, CrudField[]> = {
  asiponas: [
    { name: "code", label: "Código", required: true },
    { name: "name", label: "Nombre corto", required: true },
    { name: "full_name", label: "Nombre oficial", required: true },
    { name: "region", label: "Región", required: true },
    { name: "coordinating_entity", label: "Entidad coordinadora" },
    { name: "director", label: "Titular" },
    { name: "website", label: "Sitio web" },
    { name: "concession_area_ha", label: "Área concesionada (Ha)", type: "number" },
    { name: "concession_area_detail", label: "Detalle del área concesionada" },
    { name: "cpd_area_ha", label: "Superficie CPD (Ha)", type: "number" },
    { name: "teu_capacity_annual", label: "Capacidad TEUs anual", type: "number" },
    { name: "max_draft_meters", label: "Calado máximo (m)", type: "number" },
    { name: "berth_positions", label: "Posiciones de atraque", type: "number" },
    { name: "annual_cargo_volume_tons", label: "Carga anual (toneladas)", type: "number" },
  ],
  directory_contacts: [
    { name: "name", label: "Nombre", required: true },
    { name: "position", label: "Cargo", required: true },
    { name: "department", label: "Departamento", required: true },
    { name: "email", label: "Correo" },
    { name: "phone", label: "Teléfono" },
    { name: "ext", label: "Extensión" },
  ],
  locations: [
    { name: "name", label: "Nombre", required: true },
    { name: "type", label: "Tipo", required: true },
    { name: "description", label: "Descripción" },
    { name: "latitude", label: "Latitud", type: "number" },
    { name: "longitude", label: "Longitud", type: "number" },
    { name: "map_url", label: "URL del mapa" },
  ],
  news: [
    { name: "title", label: "Titular", required: true },
    { name: "source", label: "Fuente" },
    { name: "summary", label: "Resumen" },
    { name: "category", label: "Categoría", type: "select", options: ["Operaciones", "Infraestructura", "Seguridad", "Finanzas", "Ambiental", "Institucional"] },
    { name: "sentiment", label: "Sentimiento", type: "select", options: ["Positivo", "Neutro", "Alerta"] },
    { name: "published_date", label: "Fecha", type: "date" },
  ],
  goals: [
    { name: "title", label: "Meta", required: true },
    { name: "kpi_name", label: "KPI", required: true },
    { name: "target_value", label: "Valor objetivo", required: true },
    { name: "progress", label: "Avance (%)", type: "number" },
    { name: "term", label: "Plazo", type: "select", options: ["Corto Plazo", "Mediano Plazo", "Largo Plazo"] },
    { name: "status", label: "Estado", type: "select", options: ["Planeación", "En Proceso", "Completado", "En Riesgo", "Suspendido"] },
  ],
  contracts: [
    { name: "code", label: "Clave", required: true },
    { name: "contractor", label: "Contratista", required: true },
    { name: "type", label: "Tipo", type: "select", options: ["Obra Pública", "Cesión Parcial de Derechos", "Servicios Privados", "Arrendamiento"] },
    { name: "start_date", label: "Inicio", type: "date", required: true },
    { name: "end_date", label: "Término", type: "date", required: true },
    { name: "amount", label: "Monto", type: "number" },
    { name: "status", label: "Estado", type: "select", options: ["Vigente", "En Ejecución", "Concluido", "Cancelado", "En Licitación"] },
  ],
  investment_projects: [
    { name: "code", label: "Clave", required: true },
    { name: "name", label: "Proyecto", required: true },
    { name: "description", label: "Descripción" },
    { name: "total_cost", label: "Costo total", type: "number" },
    { name: "exec_physical", label: "Avance físico (%)", type: "number" },
    { name: "exec_financial", label: "Avance financiero (%)", type: "number" },
    { name: "status", label: "Estado", type: "select", options: ["Planeación", "Licitación", "En Ejecución", "Completado", "Suspendido"] },
  ],
  budget_items: [
    { name: "concept", label: "Concepto", required: true },
    { name: "type", label: "Tipo", required: true },
    { name: "allocated", label: "Asignado", type: "number" },
    { name: "spent", label: "Ejecutado", type: "number" },
  ],
};

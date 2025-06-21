
export interface CustomFieldDefinition {
  id: string;          // Unique ID for the definition, e.g., "cf_tshirt_size_co001"
  companyId: string;   // ID of the company this custom field belongs to
  name: string;        // User-friendly name of the custom field, e.g., "T-Shirt Size"
  type: "Text" | "Number" | "Date"; // Type of data this field holds (start with Text)
  order: number;       // For display order in forms/tables
  isDeletable: boolean;// Can this definition be deleted? (e.g., not if in use)
}

// Example custom field definitions for Umoja Tech Solutions (co_001)
export const exampleCustomFieldDefinitionsForUmoja: Omit<CustomFieldDefinition, 'companyId'>[] = [
  {
    id: "cf_tshirt_size_co001",
    name: "T-Shirt Size",
    type: "Text",
    order: 1,
    isDeletable: true,
  },
  {
    id: "cf_laptop_asset_co001",
    name: "Laptop Asset Tag",
    type: "Text",
    order: 2,
    isDeletable: true,
  },
];

// Example custom field definitions for Isoko Trading Co. (co_002)
export const exampleCustomFieldDefinitionsForIsoko: Omit<CustomFieldDefinition, 'companyId'>[] = [
  {
    id: "cf_transport_route_co002",
    name: "Transport Route",
    type: "Text",
    order: 1,
    isDeletable: true,
  },
  {
    id: "cf_uniform_issued_co002",
    name: "Uniform Issued Date",
    type: "Date", // Example of a different type
    order: 2,
    isDeletable: true,
  },
];

export const initialCustomFieldDefinitionsForCompanySeed = (companyId: string): CustomFieldDefinition[] => {
    if (companyId === "co_001") {
        return exampleCustomFieldDefinitionsForUmoja.map(cf => ({ ...cf, companyId }));
    }
    if (companyId === "co_002") {
        return exampleCustomFieldDefinitionsForIsoko.map(cf => ({ ...cf, companyId }));
    }
    return [];
};
    
export interface CustomFieldDefinition {
  id: string;          // Unique ID for the definition, e.g., "cf_tshirt_size_co001"
  companyId: string;   // ID of the company this custom field belongs to
  name: string;        // User-friendly name of the custom field, e.g., "T-Shirt Size"
  type: "Text" | "Number" | "Date"; // Type of data this field holds (start with Text)
  orderNumber: number;       // For display order in forms/tables
  isDeletable: boolean;// Can this definition be deleted? (e.g., not if in use)
}

// Example custom field definitions for companies
export const exampleCustomFieldDefinitions: Omit<CustomFieldDefinition, 'companyId'>[] = [
  {
    id: "cf_tshirt_size",
    name: "T-Shirt Size",
    type: "Text",
    orderNumber: 1,
    isDeletable: true,
  },
  {
    id: "cf_laptop_asset",
    name: "Laptop Asset Tag",
    type: "Text",
    orderNumber: 2,
    isDeletable: true,
  },
  {
    id: "cf_transport_route",
    name: "Transport Route",
    type: "Text",
    orderNumber: 3,
    isDeletable: true,
  },
  {
    id: "cf_uniform_issued",
    name: "Uniform Issued Date",
    type: "Date",
    orderNumber: 4,
    isDeletable: true,
  },
];

export const initialCustomFieldDefinitionsForCompanySeed = (companyId: string): CustomFieldDefinition[] => {
    // Return a basic set of example custom fields for any new company
    // Users can modify or delete these as needed
    return exampleCustomFieldDefinitions.map(cf => ({ 
        ...cf, 
        companyId, 
        id: `${cf.id}_${companyId}` // Make IDs unique per company
    }));
};

// --- Mapping utilities for frontend/backend case conversion ---
// Import centralized case conversion utilities
export { customFieldDefinitionFromBackend, customFieldDefinitionToBackend } from './case-conversion';

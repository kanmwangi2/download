

'use client';

import { initialUsers, type User, type Company as UserDataCompanyType } from '@/lib/userData';
import { initialStaffData, type StaffMember } from '@/lib/staffData';
import { initialPaymentDataStore, type StaffPaymentDetails } from '@/lib/paymentData';
import { initialDeductionsData } from '@/lib/deductionsData';
import { initialPayrollRunsSeedData } from '@/lib/payrollData';
import type { PayrollRunSummary } from '@/app/app/(main)/payroll/page';
import type { Deduction } from '@/app/app/(main)/deductions/page';
import { defaultInitialCompanyProfile as defaultCompanyProfileForSeed, type CompanyProfileData } from '@/app/app/(main)/settings/company/page';
import { initialDepartments as defaultDepartmentsForSeed, type Department } from '@/app/app/(main)/settings/company/page';
import type { TaxSettingsData } from '@/components/settings/taxes-tab';
import { PAYE_BANDS as DEFAULT_PAYE_BANDS, PENSION_EMPLOYER_RATE as DEFAULT_PENSION_EMPLOYER_RATE, PENSION_EMPLOYEE_RATE as DEFAULT_PENSION_EMPLOYEE_RATE, MATERNITY_EMPLOYER_RATE as DEFAULT_MATERNITY_EMPLOYER_RATE, MATERNITY_EMPLOYEE_RATE as DEFAULT_MATERNITY_EMPLOYEE_RATE, CBHI_RATE as DEFAULT_CBHI_RATE, RAMA_EMPLOYER_RATE as DEFAULT_RAMA_EMPLOYER_RATE, RAMA_EMPLOYEE_RATE as DEFAULT_RAMA_EMPLOYEE_RATE } from "@/lib/taxConfig";
import { initialPaymentTypesForCompanySeed, exampleUserDefinedPaymentTypesForUmoja, exampleUserDefinedPaymentTypesForIsoko, type PaymentType } from '@/lib/paymentTypesData';
import { initialDeductionTypesForCompanySeed, exampleUserDefinedDeductionTypesForUmoja, exampleUserDefinedDeductionTypesForIsoko, type DeductionType } from '@/lib/deductionTypesData';
import { initialCustomFieldDefinitionsForCompanySeed, type CustomFieldDefinition } from '@/lib/customFieldDefinitionData';
import { initialCompaniesDataForSeed } from '@/components/settings/company-management-tab';


const DB_NAME = 'cheetahPayrollDB';
const DB_VERSION = 12; // Incremented version for new AUDIT_LOGS store

export const STORE_NAMES = {
  STAFF: 'staffDataList',
  PAYMENT_CONFIGS: 'staffPaymentConfigs',
  DEDUCTIONS: 'staffDeductions',
  TAX_SETTINGS: 'taxSettings',
  COMPANY_PROFILE: 'companyProfile',
  DEPARTMENTS: 'companyDepartments',
  USER_PROFILE: 'userProfileDetails',
  PAYROLL_SUMMARIES: 'payrollRunSummaries',
  PAYROLL_RUN_DETAILS: 'payrollRunDetailsStore',
  USER_AVATAR: 'userAvatar',
  USERS: 'users',
  COMPANIES: 'applicationCompaniesList',
  PAYMENT_TYPES: 'companyPaymentTypes',
  DEDUCTION_TYPES: 'companyDeductionTypes',
  CUSTOM_FIELD_DEFINITIONS: 'customFieldDefinitions',
  AUDIT_LOGS: 'auditLogs' // New store
};

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  userId?: string;
  userEmail?: string;
  companyId?: string | null;
  companyName?: string | null;
  action: string;
  details: string;
  // ipAddress?: string; // Future consideration
  // userAgent?: string; // Future consideration
}


export const FIXED_KEY_SINGLETON = 'singletonData';
const UMOJA_COMPANY_ID = "co_001";
const ISOKO_COMPANY_ID = "co_002";

let dbPromise: Promise<IDBDatabase> | null = null;

interface ApplicationCompany extends UserDataCompanyType {
  tinNumber?: string;
  address?: string;
  email?: string;
  phone?: string;
  primaryBusiness?: string;
}

const getDefaultTaxSettingsForSeed = (): TaxSettingsData => ({
    payeBand1Limit: DEFAULT_PAYE_BANDS.BAND1_LIMIT, payeBand2Limit: DEFAULT_PAYE_BANDS.BAND2_LIMIT,
    payeBand3Limit: DEFAULT_PAYE_BANDS.BAND3_LIMIT, payeRate1: DEFAULT_PAYE_BANDS.RATE1 * 100,
    payeRate2: DEFAULT_PAYE_BANDS.RATE2 * 100, payeRate3: DEFAULT_PAYE_BANDS.RATE3 * 100,
    payeRate4: DEFAULT_PAYE_BANDS.RATE4 * 100, pensionEmployerRate: DEFAULT_PENSION_EMPLOYER_RATE * 100,
    pensionEmployeeRate: DEFAULT_PENSION_EMPLOYEE_RATE * 100, maternityEmployerRate: DEFAULT_MATERNITY_EMPLOYER_RATE * 100,
    maternityEmployeeRate: DEFAULT_MATERNITY_EMPLOYEE_RATE * 100, cbhiRate: DEFAULT_CBHI_RATE * 100,
    ramaEmployerRate: DEFAULT_RAMA_EMPLOYER_RATE * 100,
    ramaEmployeeRate: DEFAULT_RAMA_EMPLOYEE_RATE * 100,
});


const openDB = (): Promise<IDBDatabase> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error("IndexedDB is not available."));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("[DB] IndexedDB error:", (event.target as IDBRequest).error);
        dbPromise = null;
        reject("Error opening IndexedDB: " + (event.target as IDBRequest).error?.message);
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBRequest<IDBDatabase>).result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBRequest<IDBDatabase>).result;
        const upgradeTransaction = (event.target as IDBOpenDBRequest).transaction;

        if (!upgradeTransaction) {
          console.error("[DB Upgrade] Upgrade transaction is null in onupgradeneeded");
          db.close();
          reject(new Error("Upgrade transaction missing"));
          return;
        }
        
        console.log(`[DB Upgrade] Upgrading from version ${event.oldVersion} to ${event.newVersion}`);

        const storesToCreateOrUpdate = [
          { name: STORE_NAMES.STAFF, options: { keyPath: 'id' }, addCompanyIdIndex: true },
          { name: STORE_NAMES.DEDUCTIONS, options: { keyPath: 'id' }, addCompanyIdIndex: true },
          { name: STORE_NAMES.DEPARTMENTS, options: { keyPath: 'id' }, addCompanyIdIndex: true },
          { name: STORE_NAMES.PAYROLL_SUMMARIES, options: { keyPath: 'id' }, addCompanyIdIndex: true },
          { name: STORE_NAMES.PAYROLL_RUN_DETAILS, options: { keyPath: 'id' }, addCompanyIdIndex: true },
          { name: STORE_NAMES.PAYMENT_CONFIGS, options: { keyPath: 'id' }, addCompanyIdIndex: true, addStaffIdIndex: true },
          { name: STORE_NAMES.COMPANY_PROFILE, options: { keyPath: 'id' } },
          { name: STORE_NAMES.USER_PROFILE, options: { keyPath: 'id'} },
          { name: STORE_NAMES.USER_AVATAR, options: { keyPath: 'id'} },
          { name: STORE_NAMES.USERS, options: { keyPath: 'id' }, addEmailIndex: true },
          { name: STORE_NAMES.COMPANIES, options: { keyPath: 'id' } },
          { name: STORE_NAMES.TAX_SETTINGS, options: { keyPath: 'id' } },
          { name: STORE_NAMES.PAYMENT_TYPES, options: { keyPath: 'id' }, addCompanyIdIndex: true },
          { name: STORE_NAMES.DEDUCTION_TYPES, options: { keyPath: 'id' }, addCompanyIdIndex: true },
          { name: STORE_NAMES.CUSTOM_FIELD_DEFINITIONS, options: { keyPath: 'id'}, addCompanyIdIndex: true, addNameIndex: true, addCompanyIdNameIndex: true},
          { name: STORE_NAMES.AUDIT_LOGS, options: { keyPath: 'id' }, addCompanyIdTimestampIndex: true, addTimestampIndex: true }, // New store config
        ];

        storesToCreateOrUpdate.forEach(s => {
          let store: IDBObjectStore;
          if (db.objectStoreNames.contains(s.name)) {
            console.log(`[DB Upgrade] Store ${s.name} exists.`);
             store = upgradeTransaction.objectStore(s.name);
          } else {
            console.log(`[DB Upgrade] Creating store: ${s.name} with options`, s.options);
            store = db.createObjectStore(s.name, s.options);
          }

          const currentStoreInstance = upgradeTransaction.objectStore(s.name);
          if (s.addCompanyIdIndex && !currentStoreInstance.indexNames.contains('companyId')) {
            currentStoreInstance.createIndex('companyId', 'companyId', { unique: false });
          }
          if (s.addStaffIdIndex && !currentStoreInstance.indexNames.contains('staffId')) {
            currentStoreInstance.createIndex('staffId', 'staffId', { unique: false });
          }
          if (s.addEmailIndex && !currentStoreInstance.indexNames.contains('email')) {
            currentStoreInstance.createIndex('email', 'email', { unique: true });
          }
          if (s.addNameIndex && !currentStoreInstance.indexNames.contains('name')) {
            currentStoreInstance.createIndex('name', 'name', { unique: false });
          }
          if (s.addCompanyIdNameIndex && !currentStoreInstance.indexNames.contains('companyId_name')) {
            currentStoreInstance.createIndex('companyId_name', ['companyId', 'name'], { unique: true });
          }
          // New indexes for AUDIT_LOGS
          if (s.name === STORE_NAMES.AUDIT_LOGS) {
            if (s.addCompanyIdTimestampIndex && !currentStoreInstance.indexNames.contains('companyId_timestamp')) {
              currentStoreInstance.createIndex('companyId_timestamp', ['companyId', 'timestamp'], { unique: false });
            }
            if (s.addTimestampIndex && !currentStoreInstance.indexNames.contains('timestamp')) {
              currentStoreInstance.createIndex('timestamp', 'timestamp', { unique: false });
            }
          }
        });
        
        if (event.oldVersion < 11) { // Only seed if upgrading from a version before full seeding
            console.log(`[DB Upgrade] Starting data seeding for version ${event.newVersion}.`);
            
            const usersStore = upgradeTransaction.objectStore(STORE_NAMES.USERS);
            initialUsers.forEach(user => { usersStore.put(user); });
            console.log(`[DB Seed] Seeded ${STORE_NAMES.USERS}.`);
            
            const companiesStore = upgradeTransaction.objectStore(STORE_NAMES.COMPANIES);
            initialCompaniesDataForSeed.forEach(company => { companiesStore.put(company); });
            console.log(`[DB Seed] Seeded ${STORE_NAMES.COMPANIES} with ${initialCompaniesDataForSeed.length} companies.`);
            const allCompanyIdsForSeeding = initialCompaniesDataForSeed.map(c => c.id);
                
            const taxSettingsStore = upgradeTransaction.objectStore(STORE_NAMES.TAX_SETTINGS);
            const defaultGlobalTaxSettings = getDefaultTaxSettingsForSeed();
            taxSettingsStore.put({ id: FIXED_KEY_SINGLETON, ...defaultGlobalTaxSettings });
            console.log(`[DB Seed] Seeded ${STORE_NAMES.TAX_SETTINGS}.`);

            const staffStore = upgradeTransaction.objectStore(STORE_NAMES.STAFF);
            initialStaffData.filter(s => allCompanyIdsForSeeding.includes(s.companyId)).forEach(staff => { staffStore.put(staff); });
            console.log(`[DB Seed] Seeded ${STORE_NAMES.STAFF} for relevant companies.`);
            
            const paymentTypesStore = upgradeTransaction.objectStore(STORE_NAMES.PAYMENT_TYPES);
            const deductionTypesStore = upgradeTransaction.objectStore(STORE_NAMES.DEDUCTION_TYPES);
            const customFieldDefinitionsStore = upgradeTransaction.objectStore(STORE_NAMES.CUSTOM_FIELD_DEFINITIONS);

            allCompanyIdsForSeeding.forEach(companyId => {
                initialPaymentTypesForCompanySeed(companyId).forEach(pt => paymentTypesStore.put(pt));
                if (companyId === UMOJA_COMPANY_ID) {
                    exampleUserDefinedPaymentTypesForUmoja.forEach(pt => paymentTypesStore.put({ ...pt, companyId: UMOJA_COMPANY_ID }));
                } else if (companyId === ISOKO_COMPANY_ID) {
                    exampleUserDefinedPaymentTypesForIsoko.forEach(pt => paymentTypesStore.put({ ...pt, companyId: ISOKO_COMPANY_ID }));
                }
                console.log(`[DB Seed] Seeded ${STORE_NAMES.PAYMENT_TYPES} for company ${companyId}.`);

                initialDeductionTypesForCompanySeed(companyId).forEach(dt => deductionTypesStore.put(dt));
                if (companyId === UMOJA_COMPANY_ID) {
                    exampleUserDefinedDeductionTypesForUmoja.forEach(dt => deductionTypesStore.put({ ...dt, companyId: UMOJA_COMPANY_ID }));
                } else if (companyId === ISOKO_COMPANY_ID) {
                    exampleUserDefinedDeductionTypesForIsoko.forEach(dt => deductionTypesStore.put({ ...dt, companyId: ISOKO_COMPANY_ID }));
                }
                console.log(`[DB Seed] Seeded ${STORE_NAMES.DEDUCTION_TYPES} for company ${companyId}.`);

                initialCustomFieldDefinitionsForCompanySeed(companyId).forEach(cfd => customFieldDefinitionsStore.put(cfd));
                console.log(`[DB Seed] Seeded ${STORE_NAMES.CUSTOM_FIELD_DEFINITIONS} for company ${companyId}.`);
            });

            const paymentConfigsStore = upgradeTransaction.objectStore(STORE_NAMES.PAYMENT_CONFIGS);
            Object.entries(initialPaymentDataStore).forEach(([compositeKey, paymentDetails]) => {
                const [companyIdFromFile, staffIdFromFile] = compositeKey.split('_');
                if (allCompanyIdsForSeeding.includes(companyIdFromFile)) { 
                    paymentConfigsStore.put({ id: compositeKey, companyId: companyIdFromFile, staffId: staffIdFromFile, ...paymentDetails });
                }
            });
            console.log(`[DB Seed] Seeded ${STORE_NAMES.PAYMENT_CONFIGS}.`);
            
            const deductionsStore = upgradeTransaction.objectStore(STORE_NAMES.DEDUCTIONS);
            initialDeductionsData.filter(d => allCompanyIdsForSeeding.includes(d.companyId))
            .forEach(deduction => deductionsStore.put(deduction));
            console.log(`[DB Seed] Seeded ${STORE_NAMES.DEDUCTIONS} for relevant companies.`);

            const payrollSummariesStore = upgradeTransaction.objectStore(STORE_NAMES.PAYROLL_SUMMARIES);
            initialPayrollRunsSeedData.filter(s => allCompanyIdsForSeeding.includes(s.companyId))
            .forEach(summary => { payrollSummariesStore.put(summary); });
            console.log(`[DB Seed] Seeded ${STORE_NAMES.PAYROLL_SUMMARIES} for relevant companies.`);
            
            const companyProfileStore = upgradeTransaction.objectStore(STORE_NAMES.COMPANY_PROFILE);
            const umojaCompanyDetails = initialCompaniesDataForSeed.find(c => c.id === UMOJA_COMPANY_ID);
            if(umojaCompanyDetails) {
                companyProfileStore.put({ 
                    id: `${UMOJA_COMPANY_ID}_${FIXED_KEY_SINGLETON}`, 
                    companyId: UMOJA_COMPANY_ID, 
                    ...defaultCompanyProfileForSeed, 
                    name: umojaCompanyDetails.name,
                    address: umojaCompanyDetails.address || "",
                    taxId: umojaCompanyDetails.tinNumber || "",
                    contactEmail: umojaCompanyDetails.email || "",
                    contactPhone: umojaCompanyDetails.phone || "",
                    primaryBusiness: umojaCompanyDetails.primaryBusiness || ""
                });
            }
            
            const isokoCompanyDetails = initialCompaniesDataForSeed.find(c => c.id === ISOKO_COMPANY_ID);
            if(isokoCompanyDetails) {
                const isokoProfileData: CompanyProfileData = {
                    ...defaultCompanyProfileForSeed,
                    name: isokoCompanyDetails.name,
                    address: isokoCompanyDetails.address || "", 
                    currency: "RWF", 
                    taxId: isokoCompanyDetails.tinNumber || "",
                    registrationNumber: "REG_ISOKO_002", 
                    contactEmail: isokoCompanyDetails.email || "", 
                    contactPhone: isokoCompanyDetails.phone || "",
                    primaryBusiness: isokoCompanyDetails.primaryBusiness || "",
                };
                companyProfileStore.put({ id: `${ISOKO_COMPANY_ID}_${FIXED_KEY_SINGLETON}`, companyId: ISOKO_COMPANY_ID, ...isokoProfileData });
            }
            console.log(`[DB Seed] Seeded ${STORE_NAMES.COMPANY_PROFILE} for ${UMOJA_COMPANY_ID} and ${ISOKO_COMPANY_ID}.`);

            const departmentsStore = upgradeTransaction.objectStore(STORE_NAMES.DEPARTMENTS);
            defaultDepartmentsForSeed.filter(d => d.id.includes("co001")).forEach(dept => { departmentsStore.put({ ...dept, companyId: UMOJA_COMPANY_ID }); });
            defaultDepartmentsForSeed.filter(d => d.id.includes("co002")).forEach(dept => { departmentsStore.put({ ...dept, companyId: ISOKO_COMPANY_ID }); });
            console.log(`[DB Seed] Seeded ${STORE_NAMES.DEPARTMENTS} for ${UMOJA_COMPANY_ID} and ${ISOKO_COMPANY_ID}.`);

            console.log(`[DB Upgrade] Data seeding complete for version ${event.newVersion}.`);
        } else {
             console.log(`[DB Upgrade] Data seeding skipped for version ${event.newVersion} as oldVersion (${event.oldVersion}) is not less than 11.`);
        }
      };
    });
  }
  return dbPromise;
};

export const getAllFromStore = async <T extends { companyId?: string }>(storeName: string, companyId: string): Promise<T[]> => {
  if (!companyId) throw new Error(`companyId is required for store ${storeName}`);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    if (!store.indexNames.contains('companyId')) {
      console.warn(`Store ${storeName} does not have a 'companyId' index. Falling back to getAll and client-side filter.`);
      const request = store.getAll();
      request.onsuccess = () => {
        const allItems = request.result as T[];
        resolve(allItems.filter(item => item.companyId === companyId));
      };
      request.onerror = (event) => reject((event.target as IDBRequest).error);
      return;
    }
    const index = store.index('companyId');
    const request = index.getAll(IDBKeyRange.only(companyId));
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = (event) => reject((event.target as IDBRequest).error);
  });
};

export const getFromStore = async <T extends { companyId?: string }>(storeName: string, key: IDBValidKey, companyId: string): Promise<T | undefined> => {
  if (!companyId) throw new Error(`companyId is required for store ${storeName}`);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => {
      const item = request.result as T | undefined;
       if (item && typeof item === 'object' && 'companyId' in item) {
         resolve(item.companyId === companyId ? item : undefined);
       } else if (item) { 
         resolve(item); 
       } else {
         resolve(undefined);
       }
    };
    request.onerror = (event) => reject((event.target as IDBRequest).error);
  });
};

export const putToStore = async <T extends { id: string; companyId?: string }>(storeName: string, item: T, companyId: string): Promise<IDBValidKey> => {
  if (!companyId && storeName !== STORE_NAMES.USERS && storeName !== STORE_NAMES.COMPANIES && storeName !== STORE_NAMES.TAX_SETTINGS && storeName !== STORE_NAMES.USER_PROFILE && storeName !== STORE_NAMES.USER_AVATAR && storeName !== STORE_NAMES.AUDIT_LOGS) { 
    throw new Error(`companyId is required for store ${storeName}`);
  }
  const db = await openDB();
  return new Promise<IDBValidKey>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    let itemToStore: T;
    if (storeName !== STORE_NAMES.USERS && storeName !== STORE_NAMES.COMPANIES && storeName !== STORE_NAMES.TAX_SETTINGS && storeName !== STORE_NAMES.USER_PROFILE && storeName !== STORE_NAMES.USER_AVATAR && storeName !== STORE_NAMES.AUDIT_LOGS) {
      itemToStore = { ...item, companyId };
    } else {
      itemToStore = item; 
    }

    const request = store.put(itemToStore);
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
  });
};

export const deleteFromStore = async (storeName: string, key: IDBValidKey, companyId: string): Promise<void> => {
  if (!companyId && storeName !== STORE_NAMES.USERS && storeName !== STORE_NAMES.COMPANIES && storeName !== STORE_NAMES.TAX_SETTINGS && storeName !== STORE_NAMES.USER_PROFILE && storeName !== STORE_NAMES.USER_AVATAR && storeName !== STORE_NAMES.AUDIT_LOGS) {
     throw new Error(`companyId is required for store ${storeName}`);
  }
  const db = await openDB();
  return new Promise<void>(async (resolve, reject) => {
    if (storeName !== STORE_NAMES.USERS && storeName !== STORE_NAMES.COMPANIES && storeName !== STORE_NAMES.TAX_SETTINGS && storeName !== STORE_NAMES.USER_PROFILE && storeName !== STORE_NAMES.USER_AVATAR && storeName !== STORE_NAMES.AUDIT_LOGS) {
        const item = await getFromStore(storeName, key, companyId).catch(() => undefined);
        if (!item) { 
          console.warn(`[DB Delete] Item with key ${String(key)} not found in store ${storeName} for company ${companyId}. Skipping delete.`);
          return resolve();
        }
    }

    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const bulkPutToStore = async <T extends { id: string; companyId?: string }>(storeName: string, items: T[], companyId: string): Promise<void> => {
  if (!companyId && storeName !== STORE_NAMES.USERS && storeName !== STORE_NAMES.COMPANIES && storeName !== STORE_NAMES.TAX_SETTINGS && storeName !== STORE_NAMES.USER_PROFILE && storeName !== STORE_NAMES.USER_AVATAR && storeName !== STORE_NAMES.AUDIT_LOGS) {
    throw new Error(`companyId is required for store ${storeName}`);
  }
  if (items.length === 0) return Promise.resolve();
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    items.forEach(item => {
        const itemToStore = (storeName !== STORE_NAMES.USERS && storeName !== STORE_NAMES.COMPANIES && storeName !== STORE_NAMES.TAX_SETTINGS && storeName !== STORE_NAMES.USER_PROFILE && storeName !== STORE_NAMES.USER_AVATAR && storeName !== STORE_NAMES.AUDIT_LOGS) ? { ...item, companyId } : item;
        store.put(itemToStore);
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getCompanySingletonData = async <T>(storeName: string, companyId: string): Promise<T | undefined> => {
  if (!companyId) throw new Error(`companyId is required for company singleton store ${storeName}`);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const key = `${companyId}_${FIXED_KEY_SINGLETON}`; 
    const request = store.get(key);
    request.onsuccess = () => {
        const result = request.result;
        if (result && typeof result === 'object' && 'id' in result && result.id === key) {
            const { id, companyId: storedCompanyId, ...data } = result as any; 
            resolve(data as T | undefined);
        } else {
            resolve(undefined); 
        }
    };
    request.onerror = (event) => reject((event.target as IDBRequest).error);
  });
};

export const putCompanySingletonData = async <T>(storeName: string, data: T, companyId: string): Promise<IDBValidKey> => {
  if (!companyId) throw new Error(`companyId is required for company singleton store ${storeName}`);
  const db = await openDB();
  return new Promise<IDBValidKey>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const key = `${companyId}_${FIXED_KEY_SINGLETON}`;
    const dataToStore = { id: key, companyId: companyId, ...data }; 
    const request = store.put(dataToStore);
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getPaymentConfigForStaff = async <T extends StaffPaymentDetails>(companyId: string, staffId: string): Promise<T | undefined> => {
  if (!companyId || !staffId) throw new Error(`companyId and staffId are required for payment configs.`);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAMES.PAYMENT_CONFIGS, 'readonly');
    const store = transaction.objectStore(STORE_NAMES.PAYMENT_CONFIGS);
    const key = `${companyId}_${staffId}`; 
    const request = store.get(key);
    request.onsuccess = () => {
        const result = request.result;
         if (result && typeof result === 'object' && 'id' in result && result.id === key) {
            const { id, companyId: storedCompanyId, staffId: storedStaffId, ...data } = result as any;
            resolve(data as T | undefined); 
        } else {
            resolve(undefined);
        }
    };
    request.onerror = (event) => reject((event.target as IDBRequest).error);
  });
};

export const putPaymentConfigForStaff = async <T extends StaffPaymentDetails>(data: T, companyId: string, staffId: string): Promise<IDBValidKey> => {
  if (!companyId || !staffId) throw new Error(`companyId and staffId are required for payment configs.`);
  const db = await openDB();
  return new Promise<IDBValidKey>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAMES.PAYMENT_CONFIGS, 'readwrite');
    const store = transaction.objectStore(STORE_NAMES.PAYMENT_CONFIGS);
    const key = `${companyId}_${staffId}`;
    const dataToStore = { id: key, companyId: companyId, staffId: staffId, ...data };
    const request = store.put(dataToStore);
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
  });
};

export const deletePaymentConfigForStaff = async (companyId: string, staffId: string): Promise<void> => {
  if (!companyId || !staffId) throw new Error(`companyId and staffId are required for payment configs.`);
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAMES.PAYMENT_CONFIGS, 'readwrite');
    const store = transaction.objectStore(STORE_NAMES.PAYMENT_CONFIGS);
    const key = `${companyId}_${staffId}`;
    store.delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getAllPaymentConfigsForCompany = async <T extends StaffPaymentDetails>(companyId: string): Promise<Record<string, T>> => {
  if (!companyId) throw new Error(`companyId is required for payment configs.`);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAMES.PAYMENT_CONFIGS, 'readonly');
    const store = transaction.objectStore(STORE_NAMES.PAYMENT_CONFIGS);

    if (!store.indexNames.contains('companyId')) {
        return reject(new Error(`Index 'companyId' not found on store ${STORE_NAMES.PAYMENT_CONFIGS}.`));
    }
    const index = store.index('companyId');
    const request = index.getAll(IDBKeyRange.only(companyId));

    request.onsuccess = () => {
      const allConfigsForCompany = request.result as ({id: string, companyId: string, staffId: string} & T)[];
      const companyConfigsMap: Record<string, T> = {};
      allConfigsForCompany.forEach(config => {
        if (config.staffId) {
          const { id, companyId: cId, staffId: sId, ...restOfConfig } = config;
          companyConfigsMap[config.staffId] = restOfConfig as T;
        }
      });
      resolve(companyConfigsMap);
    };
    request.onerror = (event) => reject((event.target as IDBRequest).error);
  });
};

export const getAllFromGlobalStore = async <T>(storeName: string): Promise<T[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as T[]);
        request.onerror = (event) => reject((event.target as IDBRequest).error);
    });
};

export const getFromGlobalStore = async <T>(storeName: string, key: IDBValidKey): Promise<T | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = (event) => reject((event.target as IDBRequest).error);
  });
};

export const getFromStoreByIndex = async <T>(storeName: string, indexName: string, key: IDBValidKey): Promise<T | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    if (!store.indexNames.contains(indexName)) {
      return reject(new Error(`Index ${indexName} not found in store ${storeName}.`));
    }
    const index = store.index(indexName);
    const request = index.get(key);
    request.onsuccess = () => {
        resolve(request.result as T | undefined);
    };
    request.onerror = (event) => reject((event.target as IDBRequest).error);
  });
};

export const putToGlobalStore = async <T extends {id: string}>(storeName: string, item: T): Promise<IDBValidKey> => {
  const db = await openDB();
  return new Promise<IDBValidKey>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
  });
};

export const bulkPutToGlobalStore = async <T extends {id: string}>(storeName: string, items: T[]): Promise<void> => {
  if (items.length === 0) return Promise.resolve();
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    items.forEach(item => store.put(item));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};


export const deleteFromGlobalStore = async (storeName: string, key: IDBValidKey): Promise<void> => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        store.delete(key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getGlobalSingletonData = async <T>(storeName: string): Promise<T | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(FIXED_KEY_SINGLETON);
    request.onsuccess = () => {
        const result = request.result as ({ id: string; value?: any } & Record<string, any>) | undefined;
        if (result && typeof result === 'object' && result.id === FIXED_KEY_SINGLETON) {
            if (storeName === STORE_NAMES.USER_AVATAR && 'value' in result) {
                resolve(result.value as T | undefined); 
            } else {
                const { id, ...data } = result; 
                resolve(data as T | undefined);
            }
        } else {
             resolve(result as T | undefined);
        }
    };
    request.onerror = (event) => reject((event.target as IDBRequest).error);
  });
};

export const putGlobalSingletonData = async <T>(storeName: string, data: T): Promise<IDBValidKey> => {
  const db = await openDB();
  return new Promise<IDBValidKey>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const dataToStore = (storeName === STORE_NAMES.USER_AVATAR && typeof data === 'string')
      ? { id: FIXED_KEY_SINGLETON, value: data }
      : { id: FIXED_KEY_SINGLETON, ...data };
    const request = store.put(dataToStore);
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
  });
};

export const logAuditEvent = async (
  action: string,
  details: string,
  companyId?: string | null,
  companyName?: string | null // Added companyName
): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAMES.AUDIT_LOGS, 'readwrite');
    const store = transaction.objectStore(STORE_NAMES.AUDIT_LOGS);

    let userId: string | undefined;
    let userEmail: string | undefined;
    if (typeof window !== 'undefined') {
      const storedUserJson = localStorage.getItem("cheetahPayrollCurrentUser");
      if (storedUserJson) {
        const currentUser = JSON.parse(storedUserJson);
        userId = currentUser.id;
        userEmail = currentUser.email;
      }
    }

    const entry: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      userId,
      userEmail,
      companyId: companyId || undefined,
      companyName: companyName || undefined,
      action,
      details,
    };
    store.add(entry);
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => {
        console.error("Audit log transaction error:", transaction.error);
        reject(transaction.error);
      }
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
};

export const getAllAuditLogs = async (
  companyId?: string | null, 
  searchTerm: string = "",
  page: number = 1,
  rowsPerPage: number = 10
): Promise<{ logs: AuditLogEntry[], totalCount: number }> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAMES.AUDIT_LOGS, 'readonly');
    const store = transaction.objectStore(STORE_NAMES.AUDIT_LOGS);
    const logs: AuditLogEntry[] = [];
    let count = 0;

    const lowerSearchTerm = searchTerm.toLowerCase();
    const cursorRequest = store.index('timestamp').openCursor(null, 'prev'); 
    let skipped = (page - 1) * rowsPerPage;

    cursorRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const log = cursor.value as AuditLogEntry;
        
        let matchesCompany = false;
        if (companyId !== undefined && companyId !== null) { 
          matchesCompany = log.companyId === companyId;
        } else { 
          matchesCompany = !log.companyId; 
        }

        let matchesSearch = true;
        if (searchTerm) {
          matchesSearch =
            log.action.toLowerCase().includes(lowerSearchTerm) ||
            log.details.toLowerCase().includes(lowerSearchTerm) ||
            (log.userEmail && log.userEmail.toLowerCase().includes(lowerSearchTerm)) ||
            (log.companyName && log.companyName.toLowerCase().includes(lowerSearchTerm));
        }

        if (matchesCompany && matchesSearch) {
          count++;
          if (skipped > 0) {
            skipped--;
          } else if (logs.length < rowsPerPage) {
            logs.push(log);
          }
        }
        cursor.continue();
      } else {
        resolve({ logs, totalCount: count });
      }
    };
    cursorRequest.onerror = (event) => reject((event.target as IDBRequest).error);
  });
};


if (typeof window !== 'undefined') {
  openDB().catch(err => console.error("Initial DB open failed:", err));
}
    
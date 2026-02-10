import { RateResult, InvoiceData, HistoryEntry, LineItem } from '../types';
import { calculateShipmentRate } from './rateEngine';
import { GOOGLE_SCRIPT_URL, HISTORY_API_URL, BRANCHES } from '../constants';

// Mock database for customer lookup
const CUSTOMER_DB: Record<string, string> = {
    '94771234567': 'John Doe',
    '94719876543': 'Jane Smith'
};

export const findCustomer = async (phone: string): Promise<string | null> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return CUSTOMER_DB[cleanPhone] || null;
};

export const calculateRate = async (country: string, service: string, actWt: number, volWt: number): Promise<RateResult> => {
    const result = calculateShipmentRate(country, service, actWt, volWt);
    return {
        chgWt: result.chgWt,
        ratePerKg: result.ratePerKg,
        total: result.total
    };
};

export const fetchInvoiceHistory = async (): Promise<HistoryEntry[]> => {
    try {
        if (!HISTORY_API_URL || HISTORY_API_URL.includes('PASTE_YOUR_NEW_WEB_APP_URL_HERE')) {
             console.warn("History fetch skipped: valid HISTORY_API_URL not found.");
             return [];
        }

        // Add timestamp to prevent browser caching
        const cacheBuster = `?t=${new Date().getTime()}`;
        const response = await fetch(HISTORY_API_URL + cacheBuster);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Handle case where script returns error object
        if (data.result === 'error') {
            console.error("Google Script Error:", data.message);
            return [];
        }

        const rawList = Array.isArray(data) ? data : (data.data || []);
        
        return rawList.map((item: any) => {
            // Reconstruct the branch object fully if possible
            const matchedBranch = BRANCHES.find(b => b.name === item.branchName) || { 
                name: item.branchName || 'Unknown', 
                code: '00', 
                address: '', 
                phone: '' 
            };

            // Parse Items JSON if available, otherwise fallback to summary or empty
            let parsedItems: LineItem[] = [];
            try {
                if (item.itemsJson && item.itemsJson !== '[]') {
                    parsedItems = JSON.parse(item.itemsJson);
                } else if (typeof item.items === 'string') {
                    // Legacy fallback
                    parsedItems = [{ id: '1', description: item.items, qty: 1 }];
                }
            } catch (e) {
                parsedItems = [{ id: '1', description: item.items || '', qty: 1 }];
            }

            return {
                ...item,
                branch: matchedBranch,
                items: parsedItems.length > 0 ? parsedItems : [{ id: '1', description: '', qty: 1 }],
                
                // FORCE STRING TYPE for Phone Numbers to prevent .replace errors
                senderPh: String(item.senderPh || ''),
                consPh: String(item.consPh || ''),
                senderName: String(item.senderName || ''),

                // New Optional Field
                consEmail: String(item.consEmail || ''),

                // Numeric Casts for Safety
                actWt: Number(item.actWt) || 0,
                volWt: Number(item.volWt) || 0,
                chgWt: Number(item.chgWt) || 0,
                ratePerKg: Number(item.ratePerKg) || 0,
                total: Number(item.freight) || 0,
                
                totalBoxes: Number(item.totalBoxes) || 1,
                
                vacQty: Number(item.vacQty) || 0,
                vacPrice: Number(item.vacPrice) || 0,
                boxQty: Number(item.boxQty) || 0,
                boxPrice: Number(item.boxPrice) || 0,
                insurance: Number(item.insurance) || 0,
                discount: Number(item.discount) || 0, // NEW
                
                grandTotal: Number(item.grandTotal) || 0,
                amountPaid: Number(item.amountPaid) || 0,
                balanceDue: Number(item.balanceDue) || 0,

                // String fields
                consAddr: item.consAddr || '',
                consCity: item.consCity || '',
                consZip: item.consZip || '',
                payMethod: item.payMethod || 'Cash'
            } as HistoryEntry;
        });

    } catch (error) {
        console.error("Failed to fetch history:", error);
        return [];
    }
};

export const saveInvoice = async (data: InvoiceData): Promise<boolean> => {
    try {
        if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('PASTE_YOUR_NEW_WEB_APP_URL_HERE')) {
            console.warn("Google Cloud Sync skipped: URL not configured.");
            return true; 
        }

        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(data)
        });
        
        console.log("Synced to Cloud:", data.invoiceNo);
        return true;
    } catch (error) {
        console.error("Cloud Sync Error:", error);
        return true;
    }
};
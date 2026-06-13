import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';



interface FaaAircraft {
  nNumber: string;
  serialNumber: string;
  mfrMdlCode: string;
  engineMfrMdl: string;
  yearMfr: string;
  typeRegistrant: string;
  name: string;
  street: string;
  street2: string;
  city: string;
  state: string;
  zipCode: string;
  region: string;
  county: string;
  country: string;
  lastActionDate: string;
  certIssueDate: string;
  certification: string;
  typeAircraft: string;
  typeEngine: string;
  statusCode: string;
  modeSCode: string;
  fractOwner: string;
  airWorthDate: string;
  expirationDate: string;
  uniqueId: string;
  kitMfr: string;
  kitModel: string;
  modeSCodeHex: string;
  model: string;
  manufacturer: string;
  acftType: string;
}

@Injectable()
export class FaaService {
  private readonly logger = new Logger(FaaService.name);
  private registry: Map<string, FaaAircraft> = new Map();
  private csvPath = path.resolve(__dirname, 'faa_registry.csv');
  private acftRefPath = path.resolve(__dirname, 'ACFTREF.txt');
  private acftRef: Map<string, { mfr: string; model: string; type: string }> = new Map();

  constructor() {
    this.loadRegistry();
  }

  loadRegistry() {
    // Load ACFTREF.txt for manufacturer/model/type lookup
    if (fs.existsSync(this.acftRefPath)) {
      const acftRefData = fs.readFileSync(this.acftRefPath, 'utf8');
      const [header, ...lines] = acftRefData.split(/\r?\n/);
      if (header) {
        // const columns = header.split(','); // unused
        for (const line of lines) {
          if (!line.trim()) continue;
          const fields = line.split(',');
          const code = fields[0]?.trim();
          if (code) {
            this.acftRef.set(code, {
              mfr: fields[1]?.trim() || '',
              model: fields[2]?.trim() || '',
              type: fields[3]?.trim() || '',
            });
          }
        }
        this.logger.log(`ACFTREF loaded: ${this.acftRef.size} aircraft types.`);
      } else {
        this.logger.warn('ACFTREF.txt header missing. Manufacturer/model/type info will be unavailable.');
      }
    } else {
      this.logger.warn('ACFTREF.txt not found. Manufacturer/model/type info will be unavailable.');
    }

    if (!fs.existsSync(this.csvPath)) {
      this.logger.warn('FAA registry CSV not found. Please download and place faa_registry.csv in the faa/ directory.');
      return;
    }
    const csvData = fs.readFileSync(this.csvPath, 'utf8');
    const records = csv.parse(csvData, { columns: true, skip_empty_lines: true }) as Array<Record<string, string>>;
    for (const rec of records) {
      if (typeof rec !== 'object' || rec === null) continue;
      const nNumber = rec['N-NUMBER']?.toUpperCase();
      if (nNumber) {
        const mfrMdlCode = rec['MFR MDL CODE']?.trim();
        let model = '', manufacturer = '', acftType = '';
        if (mfrMdlCode && this.acftRef.has(mfrMdlCode)) {
          const ref = this.acftRef.get(mfrMdlCode)!;
          manufacturer = ref.mfr || '';
          model = ref.model || '';
          acftType = ref.type || '';
        }
        this.registry.set(nNumber, {
          nNumber: nNumber || '',
          serialNumber: rec['SERIAL NUMBER'] || '',
          mfrMdlCode: mfrMdlCode || '',
          engineMfrMdl: rec['ENG MFR MDL'] || '',
          yearMfr: rec['YEAR MFR'] || '',
          typeRegistrant: rec['TYPE REGISTRANT'] || '',
          name: rec['NAME'] || '',
          street: rec['STREET'] || '',
          street2: rec['STREET2'] || '',
          city: rec['CITY'] || '',
          state: rec['STATE'] || '',
          zipCode: rec['ZIP CODE'] || '',
          region: rec['REGION'] || '',
          county: rec['COUNTY'] || '',
          country: rec['COUNTRY'] || '',
          lastActionDate: rec['LAST ACTION DATE'] || '',
          certIssueDate: rec['CERT ISSUE DATE'] || '',
          certification: rec['CERTIFICATION'] || '',
          typeAircraft: rec['TYPE AIRCRAFT'] || '',
          typeEngine: rec['TYPE ENGINE'] || '',
          statusCode: rec['STATUS CODE'] || '',
          modeSCode: rec['MODE S CODE'] || '',
          fractOwner: rec['FRACT OWNER'] || '',
          airWorthDate: rec['AIR WORTH DATE'] || '',
          expirationDate: rec['EXPIRATION DATE'] || '',
          uniqueId: rec['UNIQUE ID'] || '',
          kitMfr: rec['KIT MFR'] || '',
          kitModel: rec['KIT MODEL'] || '',
          modeSCodeHex: rec['MODE S CODE HEX'] || '',
          model: model || '',
          manufacturer: manufacturer || '',
          acftType: acftType || '',
        });
      }
    }
    this.logger.log(`FAA registry loaded: ${this.registry.size} aircraft.`);
  }

  lookupNNumber(nNumber: string): FaaAircraft | undefined {
    return this.registry.get(nNumber.toUpperCase());
  }
}

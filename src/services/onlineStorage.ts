import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  OperationType,
  uploadToFirebaseStorage
} from './firebase';
import {
  Vehicle,
  Connector,
  FuseBox,
  WiringDiagram,
  MediaItem,
  Manufacturer,
  PublicationStatus,
  ECU,
  AppUserProfile,
  AppUserRole,
  AuditLogEntry
} from '../types';
import {
  SEED_MANUFACTURERS,
  SEED_VEHICLES,
  SEED_CONNECTORS,
  SEED_FUSEBOXES,
  SEED_WIRING_DIAGRAMS
} from '../data/seedData';
import { storage } from './storage';
import { deduplicateMediaList, getMediaCanonicalKey } from '../utils/imageDeduplication';

/**
 * Recursively strips keys with `undefined` values from an object,
 * because Cloud Firestore setDoc/updateDoc strictly disallows `undefined`.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirestore(value);
      }
    }
    return result as T;
  }
  return data;
}

class OnlineStorageService {
  // --- Vehicles ---
  public async getVehicles(includeDrafts = false): Promise<Vehicle[]> {
    const path = 'vehicles';
    try {
      const q = includeDrafts
        ? query(collection(db, path))
        : query(collection(db, path), where('status', 'in', ['published', 'verified']));

      const snap = await getDocs(q);
      const list: Vehicle[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as Vehicle);
      });
      return list;
    } catch (err) {
      console.warn('Failed to fetch vehicles from Firestore, falling back to local:', err);
      return [];
    }
  }

  public async saveVehicle(vehicle: Vehicle): Promise<void> {
    const path = `vehicles/${vehicle.id}`;
    try {
      const sanitized = sanitizeForFirestore({
        ...vehicle,
        updatedAt: Date.now()
      });
      await setDoc(doc(db, 'vehicles', vehicle.id), sanitized);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  public async deleteVehicle(id: string): Promise<void> {
    const path = `vehicles/${id}`;
    try {
      await deleteDoc(doc(db, 'vehicles', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // --- Connectors ---
  public async getConnectors(vehicleId?: string, includeDrafts = false): Promise<Connector[]> {
    const path = 'connectors';
    try {
      let q = collection(db, path);
      const snap = await getDocs(q);
      let list: Connector[] = [];
      snap.forEach(docSnap => {
        const item = docSnap.data() as Connector;
        list.push(item);
      });

      if (!includeDrafts) {
        list = list.filter(c => c.status === 'published' || c.status === 'verified');
      }

      if (vehicleId) {
        list = list.filter(c => c.vehicleId === vehicleId);
      }
      return list;
    } catch (err) {
      console.warn('Failed to fetch connectors from Firestore:', err);
      return [];
    }
  }

  public async saveConnector(connector: Connector): Promise<void> {
    const path = `connectors/${connector.id}`;
    try {
      const sanitized = sanitizeForFirestore({
        ...connector,
        updatedAt: Date.now()
      });
      await setDoc(doc(db, 'connectors', connector.id), sanitized);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  public async deleteConnector(id: string): Promise<void> {
    const path = `connectors/${id}`;
    try {
      await deleteDoc(doc(db, 'connectors', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // --- FuseBoxes ---
  public async getFuseBoxes(vehicleId?: string, includeDrafts = false): Promise<FuseBox[]> {
    const path = 'fuseBoxes';
    try {
      const snap = await getDocs(collection(db, path));
      let list: FuseBox[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as FuseBox);
      });

      if (!includeDrafts) {
        list = list.filter(fb => fb.status !== 'draft' && fb.status !== 'archived');
      }
      if (vehicleId) {
        list = list.filter(fb => fb.vehicleId === vehicleId);
      }
      return list;
    } catch (err) {
      console.warn('Failed to fetch fuse boxes from Firestore:', err);
      return [];
    }
  }

  public async saveFuseBox(fuseBox: FuseBox): Promise<void> {
    const path = `fuseBoxes/${fuseBox.id}`;
    try {
      const sanitized = sanitizeForFirestore({
        ...fuseBox,
        status: fuseBox.status || 'published',
        updatedAt: Date.now()
      });
      await setDoc(doc(db, 'fuseBoxes', fuseBox.id), sanitized);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  public async deleteFuseBox(id: string): Promise<void> {
    const path = `fuseBoxes/${id}`;
    try {
      await deleteDoc(doc(db, 'fuseBoxes', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // --- Wiring Diagrams ---
  public async getWiringDiagrams(vehicleId?: string): Promise<WiringDiagram[]> {
    const path = 'wiringDiagrams';
    try {
      const snap = await getDocs(collection(db, path));
      let list: WiringDiagram[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as WiringDiagram);
      });
      if (vehicleId) {
        list = list.filter(d => d.vehicleId === vehicleId);
      }
      return list;
    } catch (err) {
      return [];
    }
  }

  public async saveWiringDiagram(diagram: WiringDiagram): Promise<void> {
    const path = `wiringDiagrams/${diagram.id}`;
    try {
      const sanitized = sanitizeForFirestore({
        ...diagram,
        status: diagram.status || 'published',
        updatedAt: Date.now()
      });
      await setDoc(doc(db, 'wiringDiagrams', diagram.id), sanitized);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  public async deleteWiringDiagram(id: string): Promise<void> {
    const path = `wiringDiagrams/${id}`;
    try {
      await deleteDoc(doc(db, 'wiringDiagrams', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // --- ECUs ---
  public async getECUs(vehicleId?: string): Promise<ECU[]> {
    const path = 'ecus';
    try {
      const snap = await getDocs(collection(db, path));
      let list: ECU[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as ECU);
      });
      if (vehicleId) {
        list = list.filter(e => e.vehicleId === vehicleId);
      }
      return list;
    } catch (err) {
      console.warn('Failed to fetch ECUs from Firestore:', err);
      return [];
    }
  }

  public async saveECU(ecu: ECU): Promise<void> {
    const path = `ecus/${ecu.id}`;
    try {
      const sanitized = sanitizeForFirestore({
        ...ecu,
        status: ecu.status || 'published'
      });
      await setDoc(doc(db, 'ecus', ecu.id), sanitized);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  public async deleteECU(id: string): Promise<void> {
    const path = `ecus/${id}`;
    try {
      await deleteDoc(doc(db, 'ecus', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // --- Media & Photos ---
  public async getMedia(entityId?: string): Promise<MediaItem[]> {
    const path = 'media';
    const localMedia = storage.getMediaItems(entityId);
    try {
      const q = collection(db, path);
      const snap = await getDocs(q);
      const cloudList: MediaItem[] = [];
      snap.forEach(docSnap => {
        cloudList.push(docSnap.data() as MediaItem);
      });

      const filteredCloud = entityId ? cloudList.filter(m => m.entityId === entityId) : cloudList;

      // Merge local and cloud media using content-based canonical deduplication
      const combined = [...localMedia, ...filteredCloud];
      const deduplicated = deduplicateMediaList(combined);

      return deduplicated;
    } catch (err) {
      console.warn('Error fetching media from firestore (using local cache):', err);
      return deduplicateMediaList(localMedia);
    }
  }

  public async saveMedia(media: MediaItem): Promise<void> {
    // 1. Always persist to localStorage first so it survives reloads & offline usage
    storage.saveMediaItem(media);

    // 2. Persist to Firestore if online
    const path = `media/${media.id}`;
    try {
      const sanitized = sanitizeForFirestore({
        ...media,
        description: media.description || '',
        source: media.source || '',
        status: media.status || 'published',
        createdAt: media.createdAt || Date.now()
      });
      await setDoc(doc(db, 'media', media.id), sanitized);
    } catch (err) {
      console.warn('Firestore saveMedia error, persisted in local storage:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  public async deleteMedia(id: string): Promise<void> {
    storage.deleteMediaItem(id);
    const path = `media/${id}`;
    try {
      await deleteDoc(doc(db, 'media', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // Seed initial automotive database to Firestore
  public async seedInitialDataToFirestore(): Promise<{ count: number }> {
    let count = 0;

    // 1. Manufacturers
    for (const man of SEED_MANUFACTURERS) {
      await setDoc(doc(db, 'manufacturers', man.id), sanitizeForFirestore({
        ...man,
        status: 'published',
        createdAt: new Date().toISOString()
      }));
      count++;
    }

    // 2. Vehicles
    for (const veh of SEED_VEHICLES) {
      await setDoc(doc(db, 'vehicles', veh.id), sanitizeForFirestore({
        ...veh,
        status: 'published',
        createdAt: new Date().toISOString()
      }));
      count++;
    }

    // 3. Connectors
    for (const conn of SEED_CONNECTORS) {
      await setDoc(doc(db, 'connectors', conn.id), sanitizeForFirestore({
        ...conn,
        status: 'published',
        createdAt: new Date().toISOString()
      }));
      count++;
    }

    // 4. FuseBoxes
    for (const fb of SEED_FUSEBOXES) {
      await setDoc(doc(db, 'fuseBoxes', fb.id), sanitizeForFirestore({
        ...fb,
        status: 'published',
        createdAt: new Date().toISOString()
      }));
      count++;
    }

    // 5. Diagrams
    for (const diag of SEED_WIRING_DIAGRAMS) {
      await setDoc(doc(db, 'wiringDiagrams', diag.id), sanitizeForFirestore({
        ...diag,
        status: 'published',
        createdAt: new Date().toISOString()
      }));
      count++;
    }

    return { count };
  }

  // --- Users & RBAC (Online Firestore) ---
  public async getUsers(): Promise<AppUserProfile[]> {
    const path = 'users';
    try {
      const snap = await getDocs(collection(db, path));
      const list: AppUserProfile[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as AppUserProfile);
      });
      return list;
    } catch (err) {
      console.warn('Failed to fetch users from Firestore, using local users:', err);
      return storage.getUsers();
    }
  }

  public async saveUser(user: AppUserProfile): Promise<void> {
    try {
      const sanitized = sanitizeForFirestore(user);
      await setDoc(doc(db, 'users', user.id), sanitized, { merge: true });
    } catch (err) {
      console.warn('Firestore saveUser error, falling back to local storage:', err);
      storage.saveUser(user);
    }
  }

  public async updateUserRole(id: string, role: AppUserRole): Promise<void> {
    try {
      await setDoc(doc(db, 'users', id), { role }, { merge: true });
      if (role === 'admin') {
        const u = storage.getUserById(id);
        await setDoc(doc(db, 'admins', id), {
          email: (u?.email || '').toLowerCase(),
          assignedAt: Date.now()
        });
      } else {
        try {
          await deleteDoc(doc(db, 'admins', id));
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.warn('Firestore updateUserRole error:', err);
    }
  }

  public async toggleUserStatus(id: string, isActive: boolean): Promise<void> {
    try {
      await setDoc(doc(db, 'users', id), { isActive }, { merge: true });
    } catch (err) {
      console.warn('Firestore toggleUserStatus error:', err);
    }
  }

  // --- Audit Logs (گزارش فعالیت‌های مدیریتی در Firestore) ---
  public async saveAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      const sanitized = sanitizeForFirestore(entry);
      await setDoc(doc(db, 'audit_logs', entry.id), sanitized);
    } catch (err) {
      console.warn('Firestore saveAuditLog warning (stored locally):', err);
    }
  }

  public async getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const list: AuditLogEntry[] = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data() as AuditLogEntry);
      });
      return list;
    } catch (err) {
      console.warn('Firestore getAuditLogs error, falling back to local audit logs:', err);
      return storage.getAuditLogs();
    }
  }
}

export const onlineStorage = new OnlineStorageService();

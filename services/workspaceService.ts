import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { WorkspaceSnapshot, WorkspaceSummary } from '../types';

const getWorkspaceCollection = (uid: string) => collection(db, 'users', uid, 'workspaces');

const clampText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

export const deriveWorkspaceTitle = (messages: WorkspaceSnapshot['messages']): string => {
  const firstUserMessage = messages.find((message) => message.role === 'user' && message.text.trim());
  if (!firstUserMessage) {
    return 'Untitled session';
  }

  return clampText(firstUserMessage.text.trim(), 48);
};

const normalizeWorkspaceSnapshot = (data: Partial<WorkspaceSnapshot> | undefined): WorkspaceSnapshot => {
  const messages = Array.isArray(data?.messages) ? data.messages : [];
  const files = Array.isArray(data?.files) ? data.files : [];
  const previewHtml = typeof data?.previewHtml === 'string' ? data.previewHtml : '';
  const requestCount = typeof data?.requestCount === 'number' ? data.requestCount : 0;
  const createdAt = typeof data?.createdAt === 'number' ? data.createdAt : Date.now();
  const updatedAt = typeof data?.updatedAt === 'number' ? data.updatedAt : createdAt;
  const titleFromData = typeof data?.title === 'string' ? data.title.trim() : '';

  return {
    title: titleFromData || deriveWorkspaceTitle(messages),
    messages,
    files,
    previewHtml,
    requestCount,
    createdAt,
    updatedAt,
  };
};

export const createEmptyWorkspaceSnapshot = (): WorkspaceSnapshot => {
  const now = Date.now();

  return {
    title: 'Untitled session',
    messages: [],
    files: [],
    previewHtml: '',
    requestCount: 0,
    createdAt: now,
    updatedAt: now,
  };
};

export const toWorkspaceSummary = (id: string, snapshot: WorkspaceSnapshot): WorkspaceSummary => ({
  id,
  title: snapshot.title,
  createdAt: snapshot.createdAt,
  updatedAt: snapshot.updatedAt,
  requestCount: snapshot.requestCount,
  messageCount: snapshot.messages.length,
});

export const listUserWorkspaces = async (uid: string): Promise<WorkspaceSummary[]> => {
  const snapshot = await getDocs(query(getWorkspaceCollection(uid), orderBy('updatedAt', 'desc'), limit(30)));

  return snapshot.docs.map((workspaceDoc) => {
    const workspace = normalizeWorkspaceSnapshot(workspaceDoc.data() as Partial<WorkspaceSnapshot>);
    return toWorkspaceSummary(workspaceDoc.id, workspace);
  });
};

export const getWorkspaceById = async (uid: string, workspaceId: string): Promise<WorkspaceSnapshot | null> => {
  const workspaceDoc = await getDoc(doc(getWorkspaceCollection(uid), workspaceId));
  if (!workspaceDoc.exists()) {
    return null;
  }

  return normalizeWorkspaceSnapshot(workspaceDoc.data() as Partial<WorkspaceSnapshot>);
};

export const createWorkspace = async (uid: string, seed?: Partial<WorkspaceSnapshot>): Promise<WorkspaceSummary> => {
  const workspaceRef = doc(getWorkspaceCollection(uid));
  const snapshot = normalizeWorkspaceSnapshot({
    ...createEmptyWorkspaceSnapshot(),
    ...seed,
  });

  await setDoc(workspaceRef, snapshot);
  return toWorkspaceSummary(workspaceRef.id, snapshot);
};

export const saveWorkspace = async (
  uid: string,
  workspaceId: string,
  snapshot: WorkspaceSnapshot,
): Promise<WorkspaceSummary> => {
  const normalizedSnapshot = normalizeWorkspaceSnapshot(snapshot);
  await setDoc(doc(getWorkspaceCollection(uid), workspaceId), normalizedSnapshot, { merge: true });
  return toWorkspaceSummary(workspaceId, normalizedSnapshot);
};

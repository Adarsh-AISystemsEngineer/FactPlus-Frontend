import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  deleteDoc,
  updateDoc,
  QueryConstraint,
  onSnapshot,
  startAfter,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase";
import { User, Claim, Chat, AnalysisResult } from "@shared/firebase-schema";

// ============ USER OPERATIONS ============
export const userService = {
  async createUser(userId: string, userData: Omit<User, "uid">) {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      uid: userId,
      ...userData,
      createdAt: Timestamp.now().toMillis(),
      updatedAt: Timestamp.now().toMillis(),
    });
  },

  async getUser(userId: string): Promise<User | null> {
    const userRef = doc(db, "users", userId);
    const snapshot = await getDoc(userRef);
    return (snapshot.data() as User) || null;
  },

  async updateUser(userId: string, updates: Partial<User>) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now().toMillis(),
    });
  },
};

// ============ CLAIM OPERATIONS ============
export const claimService = {
  async createClaim(userId: string, claimText: string) {
    const claimsRef = collection(db, "claims");
    const claimId = doc(claimsRef).id;

    await setDoc(doc(claimsRef, claimId), {
      id: claimId,
      userId,
      text: claimText,
      createdAt: Timestamp.now().toMillis(),
      updatedAt: Timestamp.now().toMillis(),
    } as Claim);

    return claimId;
  },

  async getClaim(claimId: string): Promise<Claim | null> {
    const claimRef = doc(db, "claims", claimId);
    const snapshot = await getDoc(claimRef);
    return (snapshot.data() as Claim) || null;
  },

  async getUserClaims(userId: string, limitCount: number = 50): Promise<Claim[]> {
    const claimsRef = collection(db, "claims");
    const q = query(
      claimsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Claim);
  },

  async updateClaim(claimId: string, updates: Partial<Claim>) {
    const claimRef = doc(db, "claims", claimId);
    await updateDoc(claimRef, {
      ...updates,
      updatedAt: Timestamp.now().toMillis(),
    });
  },

  async deleteClaim(claimId: string) {
    const claimRef = doc(db, "claims", claimId);
    await deleteDoc(claimRef);
  },

  // Pagination support for user claims
  async getUserClaimsPaginated(
    userId: string,
    pageSize: number = 10,
    lastVisible?: QueryDocumentSnapshot
  ): Promise<{ claims: Claim[]; lastVisible: QueryDocumentSnapshot | null }> {
    const claimsRef = collection(db, "claims");
    let q;

    if (lastVisible) {
      q = query(
        claimsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(pageSize)
      );
    } else {
      q = query(
        claimsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(q);
    const claims = snapshot.docs.map((doc) => doc.data() as Claim);
    const newLastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { claims, lastVisible: newLastVisible };
  },

  // Delete all user claims
  async deleteAllUserClaims(userId: string) {
    const claimsRef = collection(db, "claims");
    const q = query(claimsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  },
};

// ============ ANALYSIS RESULT OPERATIONS ============
export const analysisService = {
  async createAnalysis(
    claimId: string,
    userId: string,
    result: Omit<AnalysisResult, "id" | "claimId" | "userId" | "createdAt">
  ) {
    const analysisRef = collection(db, "analysis");
    const analysisId = doc(analysisRef).id;

    // Filter out undefined values before saving
    const dataToSave: any = {
      id: analysisId,
      claimId,
      userId,
      createdAt: Timestamp.now().toMillis(),
    };

    // Only add fields that have defined values
    if (result.score !== undefined) dataToSave.score = result.score;
    if (result.summary !== undefined) dataToSave.summary = result.summary;
    if (result.reasoning !== undefined) dataToSave.reasoning = result.reasoning;
    if (result.sources !== undefined) dataToSave.sources = result.sources;
    if (result.sessionId !== undefined) dataToSave.sessionId = result.sessionId;

    await setDoc(doc(analysisRef, analysisId), dataToSave as AnalysisResult);

    return analysisId;
  },

  async getAnalysisByClaim(claimId: string): Promise<AnalysisResult | null> {
    const analysisRef = collection(db, "analysis");
    const q = query(analysisRef, where("claimId", "==", claimId), limit(1));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : (snapshot.docs[0].data() as AnalysisResult);
  },

  async getUserAnalysis(userId: string, limitCount: number = 50): Promise<AnalysisResult[]> {
    const analysisRef = collection(db, "analysis");
    const q = query(
      analysisRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as AnalysisResult);
  },
};

// ============ CHAT HISTORY OPERATIONS ============
export const chatService = {
  async createChat(userId: string, title: string) {
    const chatsRef = collection(db, "chats");
    const chatId = doc(chatsRef).id;

    await setDoc(doc(chatsRef, chatId), {
      id: chatId,
      userId,
      title,
      messages: [],
      createdAt: Timestamp.now().toMillis(),
      updatedAt: Timestamp.now().toMillis(),
    } as Chat);

    return chatId;
  },

  async getChat(chatId: string): Promise<Chat | null> {
    const chatRef = doc(db, "chats", chatId);
    const snapshot = await getDoc(chatRef);
    return (snapshot.data() as Chat) || null;
  },

  async getUserChats(userId: string, limitCount: number = 50): Promise<Chat[]> {
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Chat);
  },

  // Real-time listener for a single chat
  onChatUpdated(chatId: string, callback: (chat: Chat | null) => void) {
    const chatRef = doc(db, "chats", chatId);
    return onSnapshot(chatRef, (snapshot) => {
      callback(snapshot.data() as Chat | null);
    });
  },

  // Real-time listener for user's chats
  onUserChatsUpdated(userId: string, callback: (chats: Chat[]) => void) {
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
      limit(50)
    );
    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map((doc) => doc.data() as Chat);
      callback(chats);
    });
  },

  async addMessage(
    chatId: string,
    message: Chat["messages"][0]
  ) {
    const chatRef = doc(db, "chats", chatId);
    const chat = await this.getChat(chatId);

    if (!chat) throw new Error("Chat not found");

    await updateDoc(chatRef, {
      messages: [...(chat.messages || []), message],
      updatedAt: Timestamp.now().toMillis(),
    });
  },

  async updateChat(chatId: string, updates: Partial<Chat>) {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      ...updates,
      updatedAt: Timestamp.now().toMillis(),
    });
  },

  async deleteChat(chatId: string) {
    const chatRef = doc(db, "chats", chatId);
    await deleteDoc(chatRef);
  },

  // Pagination support for user chats
  async getUserChatsPaginated(
    userId: string,
    pageSize: number = 10,
    lastVisible?: QueryDocumentSnapshot
  ): Promise<{ chats: Chat[]; lastVisible: QueryDocumentSnapshot | null }> {
    const chatsRef = collection(db, "chats");
    let q;

    if (lastVisible) {
      q = query(
        chatsRef,
        where("userId", "==", userId),
        orderBy("updatedAt", "desc"),
        startAfter(lastVisible),
        limit(pageSize)
      );
    } else {
      q = query(
        chatsRef,
        where("userId", "==", userId),
        orderBy("updatedAt", "desc"),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(q);
    const chats = snapshot.docs.map((doc) => doc.data() as Chat);
    const newLastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { chats, lastVisible: newLastVisible };
  },

  // Delete all user chats
  async deleteAllUserChats(userId: string) {
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  },
};

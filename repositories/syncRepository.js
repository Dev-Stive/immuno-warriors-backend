const { db } = require('../services/firebaseService');
const { generateDelta, applyDelta } = require('../utils/syncUtils');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const logger = require('../utils/logger');
const { formatTimestamp } = require('../utils/syncUtils');
const { fromFirestore, toFirestore } = require('../models/researchModel');

class SyncRepository {
  constructor() {
    this.userCollection = db.collection('users');
    this.inventoryCollection = db.collection('inventoryItems');
    this.threatCollection = db.collection('threats');
    this.memoryCollection = db.collection('memorySignatures');
    this.multiplayerCollection = db.collection('multiplayerSessions');
    this.notificationCollection = db.collection('notifications');
    this.pathogenCollection = db.collection('pathogens');
    this.researchCollection = db.collection('researches');
  }

  async synchronizeUserData(userId, localData, lastSyncTimestamp) {
    try {
      const doc = await this.userCollection.doc(userId).get();
      if (!doc.exists) throw new NotFoundError('Utilisateur non trouvé');

      const remoteData = doc.data() || {};
      const delta = generateDelta(localData, remoteData, lastSyncTimestamp);
      const updatedData = applyDelta(remoteData, delta);

      await this.userCollection.doc(userId).update({
        ...updatedData,
        updatedAt: formatTimestamp(),
      });
      logger.info(`Données de l'utilisateur ${userId} synchronisées`);
      return delta;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des données utilisateur', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la synchronisation des données utilisateur');
    }
  }

  async synchronizeInventory(userId, localItems, lastSyncTimestamp) {
    try {
      const snapshot = await this.inventoryCollection.where('userId', '==', userId).get();
      const remoteItems = snapshot.docs.map(doc => doc.data());
      const delta = generateDelta(localItems, remoteItems, lastSyncTimestamp);
      const updatedItems = applyDelta(remoteItems, delta);

      const batch = db.batch();
      updatedItems.forEach(item => {
        const docRef = this.inventoryCollection.doc(item.id);
        batch.set(docRef, item);
      });
      await batch.commit();
      logger.info(`Inventaire de l'utilisateur ${userId} synchronisé`);
      return delta;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation de l\'inventaire', { error });
      throw new AppError(500, 'Erreur serveur lors de la synchronisation de l\'inventaire');
    }
  }

  async synchronizeThreats(localThreats, lastSyncTimestamp) {
    try {
      const snapshot = await this.threatCollection.get();
      const remoteThreats = snapshot.docs.map(doc => fromFirestore(doc.data()));
      const delta = generateDelta(localThreats, remoteThreats, lastSyncTimestamp);
      const updatedThreats = applyDelta(remoteThreats, delta);

      const batch = db.batch();
      updatedThreats.forEach(threat => {
        const docRef = this.threatCollection.doc(threat.id);
        batch.set(docRef, toFirestore(threat));
      });
      await batch.commit();
      logger.info('Menaces synchronisées');
      return delta;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des menaces', { error });
      throw new AppError(500, 'Erreur serveur lors de la synchronisation des menaces');
    }
  }

  async synchronizeMemorySignatures(userId, localSignatures, lastSyncTimestamp) {
    try {
      const snapshot = await this.memoryCollection.where('userId', '==', userId).get();
      const remoteSignatures = snapshot.docs.map(doc => doc.data());
      const delta = generateDelta(localSignatures, remoteSignatures, lastSyncTimestamp);
      const updatedSignatures = applyDelta(remoteSignatures, delta);

      const batch = db.batch();
      updatedSignatures.forEach(signature => {
        const docRef = this.memoryCollection.doc(signature.id);
        batch.set(docRef, signature);
      });
      await batch.commit();
      logger.info(`Signatures mémoire de l'utilisateur ${userId} synchronisées`);
      return delta;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des signatures mémoire', { error });
      throw new AppError(500, 'Erreur serveur lors de la synchronisation des signatures mémoire');
    }
  }

  async synchronizeMultiplayerSessions(userId, localSessions, lastSyncTimestamp) {
    try {
      const snapshot = await this.multiplayerCollection.where('players', 'array-contains', userId).get();
      const remoteSessions = snapshot.docs.map(doc => doc.data());
      const delta = generateDelta(localSessions, remoteSessions, lastSyncTimestamp);
      const updatedSessions = applyDelta(remoteSessions, delta);

      const batch = db.batch();
      updatedSessions.forEach(session => {
        const docRef = this.multiplayerCollection.doc(session.sessionId);
        batch.set(docRef, session);
      });
      await batch.commit();
      logger.info(`Sessions multijoueurs de l'utilisateur ${userId} synchronisées`);
      return delta;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des sessions multijoueurs', { error });
      throw new AppError(500, 'Erreur serveur lors de la synchronisation des sessions multijoueurs');
    }
  }

  async synchronizeNotifications(userId, localNotifications, lastSyncTimestamp) {
    try {
      const snapshot = await this.notificationCollection.where('userId', '==', userId).get();
      const remoteNotifications = snapshot.docs.map(doc => doc.data());
      const delta = generateDelta(localNotifications, remoteNotifications, lastSyncTimestamp);
      const updatedNotifications = applyDelta(remoteNotifications, delta);

      const batch = db.batch();
      updatedNotifications.forEach(notification => {
        const docRef = this.notificationCollection.doc(notification.id);
        batch.set(docRef, notification);
      });
      await batch.commit();
      logger.info(`Notifications de l'utilisateur ${userId} synchronisées`);
      return delta;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des notifications', { error });
      throw new AppError(500, 'Erreur serveur lors de la synchronisation des notifications');
    }
  }

  async synchronizePathogens(localPathogens, lastSyncTimestamp) {
    try {
      const snapshot = await this.pathogenCollection.get();
      const remotePathogens = snapshot.docs.map(doc => doc.data());
      const delta = generateDelta(localPathogens, remotePathogens, lastSyncTimestamp);
      const updatedPathogens = applyDelta(remotePathogens, delta);

      const batch = db.batch();
      updatedPathogens.forEach(pathogen => {
        const docRef = this.pathogenCollection.doc(pathogen.id);
        batch.set(docRef, pathogen);
      });
      await batch.commit();
      logger.info('Pathogènes synchronisés');
      return delta;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des pathogènes', { error });
      throw new AppError(500, 'Erreur serveur lors de la synchronisation des pathogènes');
    }
  }

  async synchronizeResearches(userId, localResearches, lastSyncTimestamp) {
    try {
      const snapshot = await this.researchCollection.where('userId', '==', userId).get();
      const remoteResearches = snapshot.docs.map(doc => fromFirestore(doc.data()));
      const delta = generateDelta(localResearches, remoteResearches, lastSyncTimestamp);
      const updatedResearches = applyDelta(remoteResearches, delta);

      const batch = db.batch();
      updatedResearches.forEach(research => {
        const docRef = this.researchCollection.doc(research.id);
        batch.set(docRef, toFirestore(research));
      });
      await batch.commit();
      logger.info(`Recherches de l'utilisateur ${userId} synchronisées`);
      return delta;
    } catch (error) {
      logger.error('Erreur lors de la synchronisation des recherches', { error });
      throw new AppError(500, 'Erreur serveur lors de la synchronisation des recherches');
    }
  }
}

module.exports = new SyncRepository();

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DisplaySettingsProvider, useDisplaySettings } from './context/DisplaySettingsContext';
import { Header } from './components/Header';
import { BottomNav, MainNavTab } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { VehicleDirectory } from './components/VehicleDirectory';
import { VehicleDetail } from './components/VehicleDetail';
import { ConnectorDetail } from './components/ConnectorDetail';
import { ConnectorsListView } from './components/ConnectorsListView';
import { FuseBoxDetail } from './components/FuseBoxDetail';
import { FuseBoxesListView } from './components/FuseBoxesListView';
import { WiringDiagramsView } from './components/WiringDiagramsView';
import { GlobalSearchView } from './components/GlobalSearchView';
import { TechnicalComparisonView } from './components/TechnicalComparisonView';
import { FavoritesView } from './components/FavoritesView';
import { NotificationsView } from './components/NotificationsView';
import { DisplaySettingsView } from './components/DisplaySettingsView';
import { AdminPanel } from './components/AdminPanel';
import { QuickToolsModal } from './components/QuickToolsModal';
import { ScreenSecurityShield } from './components/ScreenSecurityShield';
import { Vehicle, Connector, FuseBox, WiringDiagram } from './types';
import { storage } from './services/storage';
import { onlineStorage } from './services/onlineStorage';

function MainAppContent() {
  const { isOnlineDbConnected, isAdmin, isLoading } = useAuth();
  const [navTab, setNavTab] = useState<MainNavTab>('home');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [selectedFuseBox, setSelectedFuseBox] = useState<FuseBox | null>(null);
  const [selectedFuseId, setSelectedFuseId] = useState<string | null>(null);
  const [selectedRelayId, setSelectedRelayId] = useState<string | null>(null);
  const [selectedDiagram, setSelectedDiagram] = useState<WiringDiagram | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [dataVersion, setDataVersion] = useState(0);

  const handleRefreshData = () => {
    setDataVersion(prev => prev + 1);
  };

  // Sync from Cloud Firestore if records exist
  useEffect(() => {
    if (isLoading || !isOnlineDbConnected) return;

    const syncOnlineData = async () => {
      try {
        const cloudVehicles = await onlineStorage.getVehicles(isAdmin);
        if (cloudVehicles.length > 0) {
          cloudVehicles.forEach(v => storage.saveVehicle(v, undefined, true));
        }

        const cloudConnectors = await onlineStorage.getConnectors(undefined, isAdmin);
        if (cloudConnectors.length > 0) {
          cloudConnectors.forEach(c => storage.saveConnector(c, undefined, true));
        }

        const cloudFuseBoxes = await onlineStorage.getFuseBoxes(undefined, isAdmin);
        if (cloudFuseBoxes.length > 0) {
          cloudFuseBoxes.forEach(fb => storage.saveFuseBox(fb, undefined, true));
        }

        setDataVersion(v => v + 1);
      } catch (err) {
        console.warn('Background Firestore sync caught fallback:', err);
      }
    };

    syncOnlineData();
  }, [isOnlineDbConnected, isAdmin]);

  // Nav Tab Changer
  const handleTabChange = (tab: MainNavTab) => {
    setNavTab(tab);
    setIsAdminOpen(false);
    if (tab === 'vehicles') {
      setSelectedVehicle(null);
    } else if (tab === 'connectors') {
      setSelectedConnector(null);
      setSelectedPinId(null);
    } else if (tab === 'fuseboxes') {
      setSelectedFuseBox(null);
      setSelectedFuseId(null);
      setSelectedRelayId(null);
    }
  };

  // Selection handlers
  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedConnector(null);
    setSelectedPinId(null);
    setSelectedFuseBox(null);
    setSelectedFuseId(null);
    setSelectedRelayId(null);
    setSelectedDiagram(null);
    setNavTab('vehicles');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectConnector = (connector: Connector) => {
    setSelectedConnector(connector);
    setSelectedPinId(null);
    setNavTab('connectors');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectConnectorPin = (connector: Connector, pinId?: string) => {
    setSelectedConnector(connector);
    setSelectedPinId(pinId || null);
    setNavTab('connectors');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectFuseBox = (fuseBox: FuseBox) => {
    setSelectedFuseBox(fuseBox);
    setSelectedFuseId(null);
    setSelectedRelayId(null);
    setNavTab('fuseboxes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectFuse = (fuseBox: FuseBox, fuseId?: string) => {
    setSelectedFuseBox(fuseBox);
    setSelectedFuseId(fuseId || null);
    setSelectedRelayId(null);
    setNavTab('fuseboxes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectRelay = (fuseBox: FuseBox, relayId?: string) => {
    setSelectedFuseBox(fuseBox);
    setSelectedRelayId(relayId || null);
    setSelectedFuseId(null);
    setNavTab('fuseboxes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectDiagram = (diagram: WiringDiagram) => {
    setSelectedDiagram(diagram);
    setNavTab('home');
  };

  const handleQuickSearchClick = (query?: string) => {
    setNavTab('search');
    setSearchInitialQuery(query || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setNavTab('home');
    setSelectedVehicle(null);
    setSelectedConnector(null);
    setSelectedPinId(null);
    setSelectedFuseBox(null);
    setSelectedFuseId(null);
    setSelectedRelayId(null);
    setSelectedDiagram(null);
    setIsAdminOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-red-500 selection:text-white">
      {/* Top Application Header */}
      <Header
        onGoHome={handleGoHome}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenTools={() => setIsToolsOpen(true)}
        onOpenFavorites={() => handleTabChange('favorites')}
        onOpenNotifications={() => {
          setIsAdminOpen(false);
          setNavTab('notifications');
        }}
        onOpenSettings={() => {
          setIsAdminOpen(false);
          handleTabChange('settings');
        }}
      />

      {/* Main Viewport Container */}
      <main className={`flex-1 w-full mx-auto p-4 sm:p-6 transition-all duration-300 ${isAdminOpen ? 'max-w-6xl' : 'max-w-4xl'}`}>
        {/* Admin Panel Overlay View */}
        {isAdminOpen ? (
          <AdminPanel
            onBack={() => setIsAdminOpen(false)}
            onRefreshData={handleRefreshData}
          />
        ) : (
          <>
            {/* 1. HOME TAB */}
            {navTab === 'home' && (
              <HomeScreen
                key={`home-${dataVersion}`}
                onSearchClick={handleQuickSearchClick}
                onSelectVehicle={handleSelectVehicle}
                onSelectConnector={handleSelectConnector}
                onSelectFuseBox={handleSelectFuseBox}
                onSelectFuse={handleSelectFuse}
                onSelectRelay={handleSelectRelay}
                onSelectDiagram={handleSelectDiagram}
                onNavigateToVehicles={() => handleTabChange('vehicles')}
                onNavigateToConnectors={() => handleTabChange('connectors')}
                onNavigateToFuseBoxes={() => handleTabChange('fuseboxes')}
                onNavigateToDiagrams={() => {
                  setSelectedDiagram(null);
                  setNavTab('home');
                }}
                onNavigateToCompare={() => handleTabChange('compare')}
                onNavigateToFavorites={() => handleTabChange('favorites')}
                onNavigateToSettings={() => handleTabChange('settings')}
                onOpenQuickTools={() => setIsToolsOpen(true)}
              />
            )}

            {/* 2. VEHICLES TAB */}
            {navTab === 'vehicles' && (
              <>
                {selectedVehicle ? (
                  <VehicleDetail
                    key={`v-${selectedVehicle.id}-${dataVersion}`}
                    vehicle={selectedVehicle}
                    onBack={() => setSelectedVehicle(null)}
                    onSelectConnector={handleSelectConnector}
                    onSelectFuseBox={handleSelectFuseBox}
                    onSelectDiagram={handleSelectDiagram}
                  />
                ) : (
                  <VehicleDirectory
                    key={`vdir-${dataVersion}`}
                    onSelectVehicle={handleSelectVehicle}
                  />
                )}
              </>
            )}

            {/* 3. CONNECTORS / PINOUT TAB */}
            {navTab === 'connectors' && (
              <>
                {selectedConnector ? (
                  <ConnectorDetail
                    key={`conn-${selectedConnector.id}-${dataVersion}`}
                    connector={selectedConnector}
                    vehicleName={
                      selectedVehicle?.name ||
                      storage.getVehicleById(selectedConnector.vehicleId || '')?.name
                    }
                    initialPinId={selectedPinId || undefined}
                    onBack={() => {
                      setSelectedConnector(null);
                      setSelectedPinId(null);
                    }}
                    onRefreshData={handleRefreshData}
                  />
                ) : (
                  <ConnectorsListView
                    key={`connlist-${dataVersion}`}
                    onSelectConnector={handleSelectConnector}
                  />
                )}
              </>
            )}

            {/* 4. FUSEBOXES TAB */}
            {navTab === 'fuseboxes' && (
              <>
                {selectedFuseBox ? (
                  <FuseBoxDetail
                    key={`fb-${selectedFuseBox.id}-${dataVersion}`}
                    fuseBox={selectedFuseBox}
                    vehicleName={
                      selectedVehicle?.name ||
                      storage.getVehicleById(selectedFuseBox.vehicleId || '')?.name
                    }
                    initialFuseId={selectedFuseId || undefined}
                    initialRelayId={selectedRelayId || undefined}
                    onBack={() => {
                      setSelectedFuseBox(null);
                      setSelectedFuseId(null);
                      setSelectedRelayId(null);
                    }}
                    onRefreshData={handleRefreshData}
                  />
                ) : (
                  <FuseBoxesListView
                    key={`fblist-${dataVersion}`}
                    onSelectFuseBox={handleSelectFuseBox}
                  />
                )}
              </>
            )}

            {/* 5. TECHNICAL COMPARISON TAB */}
            {navTab === 'compare' && (
              <TechnicalComparisonView
                key={`compare-${dataVersion}`}
                onSelectVehicle={handleSelectVehicle}
                onSelectConnector={handleSelectConnector}
                onSelectFuseBox={handleSelectFuseBox}
                onClose={() => setNavTab('home')}
              />
            )}

            {/* 6. SEARCH TAB */}
            {navTab === 'search' && (
              <GlobalSearchView
                key={`search-${dataVersion}-${searchInitialQuery}`}
                initialQuery={searchInitialQuery}
                onSelectVehicle={handleSelectVehicle}
                onSelectConnectorPin={handleSelectConnectorPin}
                onSelectFuse={handleSelectFuse}
                onSelectRelay={handleSelectRelay}
                onSelectDiagram={handleSelectDiagram}
                onClose={() => setNavTab('home')}
              />
            )}

            {/* 7. FAVORITES & BOOKMARKS TAB */}
            {navTab === 'favorites' && (
              <FavoritesView
                key={`favs-${dataVersion}`}
                onBack={() => setNavTab('home')}
                onSelectVehicle={handleSelectVehicle}
                onSelectConnector={handleSelectConnector}
                onSelectFuseBox={handleSelectFuseBox}
                onSelectFuse={handleSelectFuse}
                onSelectRelay={handleSelectRelay}
                onSelectDiagram={handleSelectDiagram}
                onNavigateToVehicles={() => handleTabChange('vehicles')}
                onNavigateToConnectors={() => handleTabChange('connectors')}
                onNavigateToFuseBoxes={() => handleTabChange('fuseboxes')}
              />
            )}

            {/* 8. IN-APP NOTIFICATIONS CENTER */}
            {navTab === 'notifications' && (
              <NotificationsView
                key={`notifs-${dataVersion}`}
                onBack={() => setNavTab('home')}
                onNavigateToVehicle={(vehicleId) => {
                  const v = storage.getVehicleById(vehicleId);
                  if (v) {
                    handleSelectVehicle(v);
                  } else {
                    handleTabChange('vehicles');
                  }
                }}
                onNavigateToApprovals={() => {
                  setIsAdminOpen(true);
                }}
                onNavigateToQC={() => {
                  setIsAdminOpen(true);
                }}
              />
            )}

            {/* 9. DISPLAY SETTINGS TAB */}
            {navTab === 'settings' && (
              <DisplaySettingsView
                key={`settings-${dataVersion}`}
                onBack={() => handleTabChange('home')}
              />
            )}
          </>
        )}
      </main>

      {/* Quick Tools & Electrical Standards Modal */}
      <QuickToolsModal
        isOpen={isToolsOpen}
        onClose={() => setIsToolsOpen(false)}
      />

      {/* Thumb-friendly Mobile Bottom Navigation */}
      <BottomNav
        activeTab={navTab}
        onChangeTab={handleTabChange}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DisplaySettingsProvider>
        <ScreenSecurityShield>
          <MainAppContent />
        </ScreenSecurityShield>
      </DisplaySettingsProvider>
    </AuthProvider>
  );
}

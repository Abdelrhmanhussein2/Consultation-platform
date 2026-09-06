import React from 'react';
import './diwanRbac.css';
import { useRbacState } from './rbac/useRbacState.jsx';
import RbacRolesView from './rbac/RbacRolesView.jsx';
import RbacUsersView from './rbac/RbacUsersView.jsx';
import RbacRoleDetailDrawer from './rbac/RbacRoleDetailDrawer.jsx';
import RbacDrawers from './rbac/RbacDrawers.jsx';
import RbacModal from './rbac/RbacModal.jsx';

export default function AdminRbacPage({ view = 'roles', navigate }) {
  const rbac = useRbacState(view);

  return (
    <div className="diwan-rbac-root">
      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 1: ROLES & PERMISSIONS MANAGEMENT (DEFAULT)
          ══════════════════════════════════════════════════════════════════════ */}
      {rbac.mainView === 'roles' && (
        <RbacRolesView
          roles={rbac.roles}
          filteredRoles={rbac.filteredRoles}
          dashboardRoleFilter={rbac.dashboardRoleFilter}
          setDashboardRoleFilter={rbac.setDashboardRoleFilter}
          rolesSearch={rbac.rolesSearch}
          setRolesSearch={rbac.setRolesSearch}
          rolesTypeFilter={rbac.rolesTypeFilter}
          setRolesTypeFilter={rbac.setRolesTypeFilter}
          totalSensitivePermsCount={rbac.totalSensitivePermsCount}
          handleOpenCreateRole={rbac.handleOpenCreateRole}
          viewRole={rbac.viewRole}
          handleOpenCopyRole={rbac.handleOpenCopyRole}
          handleToggleRoleStatus={rbac.handleToggleRoleStatus}
          handleDeleteRole={rbac.handleDeleteRole}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 2: USERS MANAGEMENT VIEW
          ══════════════════════════════════════════════════════════════════════ */}
      {rbac.mainView === 'users' && (
        <RbacUsersView
          systemUsers={rbac.systemUsers}
          filteredSystemUsers={rbac.filteredSystemUsers}
          roles={rbac.roles}
          usersDashboardFilter={rbac.usersDashboardFilter}
          setUsersDashboardFilter={rbac.setUsersDashboardFilter}
          userSearch={rbac.userSearch}
          setUserSearch={rbac.setUserSearch}
          userRoleFilter={rbac.userRoleFilter}
          setUserRoleFilter={rbac.setUserRoleFilter}
          userStatusFilter={rbac.userStatusFilter}
          setUserStatusFilter={rbac.setUserStatusFilter}
          handleOpenNewUser={rbac.handleOpenNewUser}
          handleOpenUserEffective={rbac.handleOpenUserEffective}
          handleOpenEditUser={rbac.handleOpenEditUser}
          handleToggleUserStatus={rbac.handleToggleUserStatus}
          handleDeleteUser={rbac.handleDeleteUser}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SLIDE-OVER LEFT DRAWER
          ══════════════════════════════════════════════════════════════════════ */}
      {rbac.drawerOpen && (
        <>
          <div className="diwanDrawerBackdrop" onClick={() => rbac.setDrawerOpen(false)} />
          <aside className="diwanDrawer">
            {rbac.drawerMode === 'role_detail' ? (
              <RbacRoleDetailDrawer
                activeRole={rbac.activeRole}
                setDrawerOpen={rbac.setDrawerOpen}
                setDrawerMode={rbac.setDrawerMode}
                handleOpenCopyRole={rbac.handleOpenCopyRole}
                currentTab={rbac.currentTab}
                setCurrentTab={rbac.setCurrentTab}
                roleUsers={rbac.roleUsers}
                setRoleUsers={rbac.setRoleUsers}
                enabledCount={rbac.enabledCount}
                countSensitive={rbac.countSensitive}
                setPermFilter={rbac.setPermFilter}
                modules={rbac.modules}
                currentModuleJump={rbac.currentModuleJump}
                handleJumpModule={rbac.handleJumpModule}
                permSearch={rbac.permSearch}
                setPermSearch={rbac.setPermSearch}
                permFilter={rbac.permFilter}
                expanded={rbac.expanded}
                handleToggleModule={rbac.handleToggleModule}
                handleToggleAllModule={rbac.handleToggleAllModule}
                getPermState={rbac.getPermState}
                handleTogglePerm={rbac.handleTogglePerm}
                handleScopeChange={rbac.handleScopeChange}
                scopeMap={rbac.scopeMap}
                scopeLabels={rbac.scopeLabels}
                hasUnsavedChanges={rbac.hasUnsavedChanges}
                cancelChanges={rbac.cancelChanges}
                handleReviewAndSave={rbac.handleReviewAndSave}
                setRoleUserForm={rbac.setRoleUserForm}
                userOverrideStats={rbac.userOverrideStats}
                openIndividualPermissions={rbac.openIndividualPermissions}
                setModalContent={rbac.setModalContent}
                showToast={rbac.showToast}
                auditTrailDetailed={rbac.auditTrailDetailed}
                filterAuditType={rbac.filterAuditType}
                setFilterAuditType={rbac.setFilterAuditType}
              />
            ) : (
              <RbacDrawers
                drawerMode={rbac.drawerMode}
                setDrawerMode={rbac.setDrawerMode}
                setDrawerOpen={rbac.setDrawerOpen}
                activeRole={rbac.activeRole}
                roles={rbac.roles}
                createRoleForm={rbac.createRoleForm}
                setCreateRoleForm={rbac.setCreateRoleForm}
                handleCreateRoleSubmit={rbac.handleCreateRoleSubmit}
                cloneRoleForm={rbac.cloneRoleForm}
                setCloneRoleForm={rbac.setCloneRoleForm}
                handleConfirmCloneRole={rbac.handleConfirmCloneRole}
                modules={rbac.modules}
                getPermState={rbac.getPermState}
                countSensitive={rbac.countSensitive}
                scopeMap={rbac.scopeMap}
                scopeLabels={rbac.scopeLabels}
                roleUsers={rbac.roleUsers}
                setRoleUsers={rbac.setRoleUsers}
                roleUserForm={rbac.roleUserForm}
                setRoleUserForm={rbac.setRoleUserForm}
                showToast={rbac.showToast}
                currentRoleUserEmail={rbac.currentRoleUserEmail}
                setCurrentRoleUserEmail={rbac.setCurrentRoleUserEmail}
                customizationReturnContext={rbac.customizationReturnContext}
                setCustomizationReturnContext={rbac.setCustomizationReturnContext}
                userOverrideStats={rbac.userOverrideStats}
                roleBasePermissionIds={rbac.roleBasePermissionIds}
                effectiveUserPermissionIds={rbac.effectiveUserPermissionIds}
                userPermExpanded={rbac.userPermExpanded}
                setUserPermExpanded={rbac.setUserPermExpanded}
                userPermMode={rbac.userPermMode}
                setUserPermOverride={rbac.setUserPermOverride}
                userPermScope={rbac.userPermScope}
                setUserPermScope={rbac.setUserPermScope}
                setAuditTrailDetailed={rbac.setAuditTrailDetailed}
                userForm={rbac.userForm}
                setUserForm={rbac.setUserForm}
                handleSaveUserSubmit={rbac.handleSaveUserSubmit}
                selectedUserIdForDrawer={rbac.selectedUserIdForDrawer}
                systemUsers={rbac.systemUsers}
                userRolePermissionSources={rbac.userRolePermissionSources}
                userPermissionOverrides={rbac.userPermissionOverrides}
                findP={rbac.findP}
                permissionMeta={rbac.permissionMeta}
                handleOpenWhyUserPerm={rbac.handleOpenWhyUserPerm}
                selectedPermIdForWhy={rbac.selectedPermIdForWhy}
                dependencies={rbac.dependencies}
              />
            )}
          </aside>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL CONFIRMATION DIALOG (FOR SENSITIVE ACTIONS & DEPENDENCIES)
          ══════════════════════════════════════════════════════════════════════ */}
      <RbacModal modalContent={rbac.modalContent} />

      {/* FLOATING TOAST FEEDBACK */}
      {rbac.toastMsg && (
        <div className="toastFloating">
          {rbac.toastMsg}
        </div>
      )}
    </div>
  );
}

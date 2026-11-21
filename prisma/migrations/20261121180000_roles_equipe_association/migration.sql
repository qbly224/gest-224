-- Rôles d'équipe supplémentaires, réservés aux comptes association
-- (cf. lib/permissions.ts) : owner/membre existants restent inchangés.
ALTER TYPE "RoleUtilisateur" ADD VALUE 'tresorier';
ALTER TYPE "RoleUtilisateur" ADD VALUE 'communication';
ALTER TYPE "RoleUtilisateur" ADD VALUE 'secretaire';

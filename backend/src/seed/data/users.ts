import { ROLES } from "../../constants/roles";

export const users = [
  {
    firstName: "Admin",
    lastName: "SecureClassify",
    displayName: "System Administrator",
    email: "admin@secureclassify.com",
    role: ROLES.ADMIN,
    departmentCode: null,
    permissions: [],
    isActive: true,
  },

  {
    firstName: "Ahmed",
    lastName: "Benali",
    displayName: "Ahmed Benali",
    email: "ahmed@secureclassify.com",
    role: ROLES.EMPLOYEE,
    departmentCode: "IT",
    permissions: [],
    isActive: true,
  },

  {
    firstName: "Sara",
    lastName: "Amrani",
    displayName: "Sara Amrani",
    email: "sara@secureclassify.com",
    role: ROLES.EMPLOYEE,
    departmentCode: "HR",
    permissions: [],
    isActive: true,
  },

  {
    firstName: "Yassine",
    lastName: "Alaoui",
    displayName: "Yassine Alaoui",
    email: "yassine@secureclassify.com",
    role: ROLES.EMPLOYEE,
    departmentCode: "FIN",
    permissions: [],
    isActive: true,
  },

  {
    firstName: "Salma",
    lastName: "Idrissi",
    displayName: "Salma Idrissi",
    email: "salma@secureclassify.com",
    role: ROLES.EMPLOYEE,
    departmentCode: "MKT",
    permissions: [],
    isActive: true,
  },
];
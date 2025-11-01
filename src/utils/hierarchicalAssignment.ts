import { User } from "@/types";

type UserRole = "Admin" | "Head" | "SubHead" | "Manager" | "DataCollector" | "Converter";

/**
 * Determines which roles can be assigned by a user based on their role
 * Following the hierarchy:
 * Head -> SubHead, Manager, Converter, DataCollector
 * SubHead -> Manager, Converter, DataCollector
 * Manager -> Converter, DataCollector
 * Converter -> DataCollector
 * DataCollector -> nil
 */
export const getAssignableRoles = (userRole: UserRole): UserRole[] => {
  switch (userRole) {
    case "Admin":
    case "Head":
      return ["SubHead", "Manager", "Converter", "DataCollector"];
    case "SubHead":
      return ["Manager", "Converter", "DataCollector"];
    case "Manager":
      return ["Converter", "DataCollector"];
    case "Converter":
      return ["DataCollector"];
    case "DataCollector":
      return [];
    default:
      return [];
  }
};

/**
 * Filters users based on the hierarchical assignment rules
 * @param users All users in the system
 * @param currentUserRole Role of the user creating/assigning the task
 * @returns Filtered list of users that can be assigned to a task
 */
export const getAssignableUsers = (users: User[], currentUserRole: UserRole): User[] => {
  const assignableRoles = getAssignableRoles(currentUserRole);
  
  // If user has no assignable roles, return empty array
  if (assignableRoles.length === 0) {
    return [];
  }
  
  // Filter users based on assignable roles
  return users.filter(user => assignableRoles.includes(user.role as UserRole));
};
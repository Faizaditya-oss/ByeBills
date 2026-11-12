import module001 from './module-001.json';
import module002 from './module-002.json';
import module003 from './module-003.json';

export const STATIC_EDUCATION_MODULES = [
  module001,
  module002,
  module003,
];

export function getEducationModuleById(id) {
  return STATIC_EDUCATION_MODULES.find((m) => m.id === id) || null;
}

export function getAllEducationModules() {
  return STATIC_EDUCATION_MODULES.filter((m) => m.isPublished);
}

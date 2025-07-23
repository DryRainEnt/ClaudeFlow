import React, { useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { ProjectOverview } from '../types/flow.types';

interface ProjectInitializerProps {
  onClose: () => void;
}

const ProjectInitializer: React.FC<ProjectInitializerProps> = ({ onClose }) => {
  const createManagerSession = useSessionStore((state) => state.createManagerSession);
  
  const [projectData, setProjectData] = useState<ProjectOverview>({
    title: '',
    description: '',
    objectives: [''],
    constraints: [''],
    deliverables: [''],
  });

  const handleArrayFieldChange = (
    field: 'objectives' | 'constraints' | 'deliverables',
    index: number,
    value: string
  ) => {
    setProjectData((prev) => ({
      ...prev,
      [field]: (prev[field] || []).map((item, i) => (i === index ? value : item)),
    }));
  };

  const addArrayField = (field: 'objectives' | 'constraints' | 'deliverables') => {
    setProjectData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), ''],
    }));
  };

  const removeArrayField = (
    field: 'objectives' | 'constraints' | 'deliverables',
    index: number
  ) => {
    setProjectData((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty strings from arrays
    const cleanedData: ProjectOverview = {
      ...projectData,
      objectives: projectData.objectives.filter((obj) => obj.trim() !== ''),
      constraints: projectData.constraints?.filter((con) => con.trim() !== ''),
      deliverables: projectData.deliverables.filter((del) => del.trim() !== ''),
    };

    // Create manager session
    createManagerSession('Project Manager', cleanedData);
    
    // Close the modal
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          Initialize New Project
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Title
            </label>
            <input
              type="text"
              required
              value={projectData.title}
              onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Enter project title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              required
              value={projectData.description}
              onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={3}
              placeholder="Describe the project"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Objectives
            </label>
            {projectData.objectives.map((objective, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => handleArrayFieldChange('objectives', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder={`Objective ${index + 1}`}
                />
                {projectData.objectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayField('objectives', index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayField('objectives')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Add Objective
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Constraints (Optional)
            </label>
            {(projectData.constraints || []).map((constraint, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={constraint}
                  onChange={(e) => handleArrayFieldChange('constraints', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder={`Constraint ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeArrayField('constraints', index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayField('constraints')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Add Constraint
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deliverables
            </label>
            {projectData.deliverables.map((deliverable, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={deliverable}
                  onChange={(e) => handleArrayFieldChange('deliverables', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder={`Deliverable ${index + 1}`}
                />
                {projectData.deliverables.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayField('deliverables', index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayField('deliverables')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Add Deliverable
            </button>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Project
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-100 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectInitializer;
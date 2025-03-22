import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Plus, GripVertical, Edit, Trash2, Clock } from 'lucide-react';
import { useTemplateStore } from '../../store/templateStore';
import { PlanTemplate, TemplateActivity } from '../../types';
import { getActivityIcon, getActivityTypeInfo } from '../../utils/activityTypes';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import TemplateForm from './TemplateForm';
import TemplateActivityForm from './TemplateActivityForm';

interface TemplateDetailsProps {
  template: PlanTemplate;
  onClose: () => void;
}

const TemplateDetails: React.FC<TemplateDetailsProps> = ({ template, onClose }) => {
  const { updateTemplate, deleteTemplate, reorderActivities } = useTemplateStore();
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<TemplateActivity | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const activityIds = Array.from(template.activities)
      .sort((a, b) => a.order_index - b.order_index)
      .map(activity => activity.id);

    const [removed] = activityIds.splice(result.source.index, 1);
    activityIds.splice(result.destination.index, 0, removed);

    reorderActivities(template.id, activityIds);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">{template.title}</h2>
          <p className="mt-1 text-sm text-gray-500">{template.description}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit size={16} />}
            onClick={() => setIsEditingTemplate(true)}
          >
            Edit Template
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsAddingActivity(true)}
          >
            Add Activity
          </Button>
        </div>
      </div>

      {template.strategy_overview && (
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Strategy Overview</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{template.strategy_overview}</p>
          </div>
        </Card>
      )}

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">Template Activities</h3>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="activities">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-3"
              >
                {template.activities
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((activity, index) => {
                    const ActivityIcon = getActivityIcon(activity.activity_type);
                    const typeInfo = getActivityTypeInfo(activity.activity_type);
                    
                    return (
                      <Draggable 
                        key={activity.id} 
                        draggableId={activity.id} 
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="p-4">
                              <div className="flex items-start">
                                <div
                                  {...provided.dragHandleProps}
                                  className="flex-shrink-0 mr-3 text-gray-400 hover:text-gray-600 cursor-grab"
                                >
                                  <GripVertical size={20} />
                                </div>
                                <div className="flex-shrink-0 mr-3">
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    <ActivityIcon size={20} className="text-blue-600" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                                      <p className="mt-1 text-sm text-gray-500">{activity.description}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="flex items-center text-sm text-gray-500">
                                        <Clock size={14} className="mr-1" />
                                        {activity.duration} days
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        leftIcon={<Edit size={14} />}
                                        onClick={() => setSelectedActivity(activity)}
                                      >
                                        Edit
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="mt-2 flex items-center text-xs text-gray-500">
                                    <span className="font-medium">{typeInfo.name}</span>
                                    {activity.has_form && (
                                      <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                        Includes Form
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Edit Template Modal */}
      <Modal
        isOpen={isEditingTemplate}
        onClose={() => setIsEditingTemplate(false)}
        title="Edit Template"
        size="lg"
      >
        <TemplateForm 
          templateId={template.id} 
          onClose={() => setIsEditingTemplate(false)} 
        />
      </Modal>

      {/* Add Activity Modal */}
      <Modal
        isOpen={isAddingActivity}
        onClose={() => setIsAddingActivity(false)}
        title="Add Activity"
        size="lg"
      >
        <TemplateActivityForm 
          templateId={template.id}
          onClose={() => setIsAddingActivity(false)}
        />
      </Modal>

      {/* Edit Activity Modal */}
      {selectedActivity && (
        <Modal
          isOpen={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          title="Edit Activity"
          size="lg"
        >
          <TemplateActivityForm 
            templateId={template.id}
            activityId={selectedActivity.id}
            onClose={() => setSelectedActivity(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default TemplateDetails;
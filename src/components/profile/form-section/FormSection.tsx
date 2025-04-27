"use client";

interface FormSectionProps {
  title?: string;
  description?: string;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection = ({ 
  title, 
  description, 
  helpText, 
  children,
  className = ''
}: FormSectionProps) => {
  return (
    <div className={`mb-4 ${className}`}>
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-gray-700 mb-2">{description}</p>
      )}
      {children}
      {helpText && (
        <p className="mt-2 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
}; 
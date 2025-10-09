import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import Colors from '@/constants/colors';

type Branch = 'Todas' | 'Norte' | 'Sur';

interface BranchToggleProps {
  selectedBranch: Branch;
  onBranchChange: (branch: Branch) => void;
  disabled?: boolean;
}

export default function BranchToggle({ selectedBranch, onBranchChange, disabled }: BranchToggleProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const branches: Branch[] = ['Todas', 'Norte', 'Sur'];

  if (disabled) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text style={styles.label}>Sucursal:</Text>
        <Text style={styles.selectedText}>{selectedBranch}</Text>
        <ChevronDown
          size={16}
          color={Colors.light.text}
          style={{
            transform: [{ rotate: isOpen ? '180deg' : '0deg' }],
          }}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdown}>
          {branches.map((branch) => (
            <TouchableOpacity
              key={branch}
              style={[
                styles.option,
                selectedBranch === branch && styles.optionSelected,
              ]}
              onPress={() => {
                onBranchChange(branch);
                setIsOpen(false);
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedBranch === branch && styles.optionTextSelected,
                ]}
              >
                {branch}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '600',
  },
  selectedText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '700',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  optionSelected: {
    backgroundColor: Colors.light.primary,
  },
  optionText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: Colors.light.background,
    fontWeight: '700',
  },
});

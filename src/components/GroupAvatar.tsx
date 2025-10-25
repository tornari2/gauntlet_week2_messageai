/**
 * GroupAvatar Component
 * 
 * Displays a divided circle avatar for group chats
 * Each segment shows a participant's color and initial
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ParticipantDetail {
  uid: string;
  displayName: string;
  avatarColor: string;
}

interface GroupAvatarProps {
  participants: ParticipantDetail[];
  size?: number;
}

export const GroupAvatar: React.FC<GroupAvatarProps> = ({ 
  participants, 
  size = 56 
}) => {
  // Limit to first 4 participants for display
  const displayParticipants = participants.slice(0, 4);
  const count = displayParticipants.length;

  // For 1-2 participants, show them side by side
  if (count <= 2) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
        {displayParticipants.map((participant, index) => (
          <View
            key={participant.uid}
            style={[
              styles.halfCircle,
              {
                width: size / 2,
                height: size,
                backgroundColor: participant.avatarColor,
                borderTopLeftRadius: index === 0 ? size / 2 : 0,
                borderBottomLeftRadius: index === 0 ? size / 2 : 0,
                borderTopRightRadius: index === 1 ? size / 2 : 0,
                borderBottomRightRadius: index === 1 ? size / 2 : 0,
              },
            ]}
          >
            <Text style={[styles.initial, { fontSize: size / 3.5 }]}>
              {participant.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  // For 3-4 participants, show them in quadrants
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={styles.row}>
        {displayParticipants.slice(0, 2).map((participant, index) => (
          <View
            key={participant.uid}
            style={[
              styles.quadrant,
              {
                width: size / 2,
                height: size / 2,
                backgroundColor: participant.avatarColor,
                borderTopLeftRadius: index === 0 ? size / 2 : 0,
                borderTopRightRadius: index === 1 ? size / 2 : 0,
              },
            ]}
          >
            <Text style={[styles.initial, { fontSize: size / 4.5 }]}>
              {participant.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
      {displayParticipants.length > 2 && (
        <View style={styles.row}>
          {displayParticipants.slice(2, 4).map((participant, index) => (
            <View
              key={participant.uid}
              style={[
                styles.quadrant,
                {
                  width: size / 2,
                  height: size / 2,
                  backgroundColor: participant.avatarColor,
                  borderBottomLeftRadius: index === 0 ? size / 2 : 0,
                  borderBottomRightRadius: index === 1 ? size / 2 : 0,
                },
              ]}
            >
              <Text style={[styles.initial, { fontSize: size / 4.5 }]}>
                {participant.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  halfCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  quadrant: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: '#fff',
    fontWeight: 'bold',
  },
});


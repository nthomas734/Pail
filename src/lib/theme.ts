export const theme = {
  bg:        '#2A1F2E',
  board:     '#0A0A0A',
  brass:     '#C8A97E',
  cream:     '#F5EDE0',
  surface:   '#1A1A1A',
  tileText:  '#FFF8EC',
  accent:    '#8B6F47',
  dim:       'rgba(245, 237, 224, 0.4)',
  dimmer:    'rgba(245, 237, 224, 0.15)',
  // status accents
  dreaming:  'rgba(245, 237, 224, 0.4)',
  scheduled: '#C8A97E',
  boarding:  '#d4a657',
  departed:  '#6b8e6b'
};

export const sanDiegoDate = new Date('2027-09-30T00:00:00');

export function daysToSanDiego(): number {
  const now = new Date();
  const diff = sanDiegoDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

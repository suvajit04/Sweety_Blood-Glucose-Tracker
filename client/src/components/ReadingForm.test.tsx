import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReadingForm } from './ReadingForm';

function setup() {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(<ReadingForm onSave={onSave} onClose={onClose} />);
  const valueInput = screen.getByLabelText(/blood glucose value/i);
  const form = screen.getByRole('dialog').querySelector('form');
  if (!form) throw new Error('Reading form was not rendered.');
  return { onSave, onClose, valueInput, form };
}

describe('ReadingForm', () => {
  it('shows the required-value message and does not submit an empty value', () => {
    const { onSave, form } = setup();
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a glucose value.');
    expect(onSave).not.toHaveBeenCalled();
  });

  it.each(['39', '601', '100.5'])('rejects invalid glucose value %s', (value) => {
    const { onSave, form, valueInput } = setup();
    fireEvent.change(valueInput, { target: { value } });
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent('Value must be between 40 and 600 mg/dl.');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('submits a valid integer reading and closes after save', async () => {
    const { onSave, onClose, valueInput, form } = setup();
    fireEvent.change(valueInput, { target: { value: '112' } });
    fireEvent.submit(form);
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ value: 112, timeSlot: 'MORNING_FASTING' })));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('shows the API validation error and keeps the form open', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('You can add only 4 readings per day.'));
    const onClose = vi.fn();
    render(<ReadingForm onSave={onSave} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/blood glucose value/i), { target: { value: '112' } });
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('You can add only 4 readings per day.');
    expect(onClose).not.toHaveBeenCalled();
  });
});

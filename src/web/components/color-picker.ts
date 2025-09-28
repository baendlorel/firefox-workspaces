class InputColorPicker extends HTMLInputElement {
  private _value: string = '#ffffff';

  constructor() {
    super();
    this.type = 'color';
    this.style.cssText = `
      width: 40px;
      height: 40px;
      border: 2px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
      background: none;
      padding: 0;
      outline: none;
    `;

    // Set initial value
    this.updateDisplayValue();

    // Listen for color changes
    this.addEventListener('input', (e) => this.handleColorChange(e));
  }

  connectedCallback() {
    // Ensure the initial value is applied when connected to DOM
    this.updateDisplayValue();
  }

  private handleColorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this._value = target.value;
    this.dispatchEvent(
      new CustomEvent('colorchange', {
        detail: { value: this._value },
        bubbles: true,
      })
    );
  }

  private isValidHexColor(color: string): boolean {
    return /^#[0-9a-fA-F]{6}$/.test(color);
  }

  private updateDisplayValue() {
    const colorToUse = this.isValidHexColor(this._value) ? this._value : '#ffffff';
    super.value = colorToUse;
  }

  // Override value getter
  get value(): string {
    return this._value;
  }

  // Override value setter
  set value(newValue: string) {
    if (typeof newValue === 'string') {
      this._value = newValue;
      this.updateDisplayValue();
    }
  }

  // Override getAttribute for value
  getAttribute(name: string): string | null {
    if (name === 'value') {
      return this._value;
    }
    return super.getAttribute(name);
  }

  // Override setAttribute for value
  setAttribute(name: string, value: string): void {
    if (name === 'value') {
      this.value = value;
    } else {
      super.setAttribute(name, value);
    }
  }

  static get observedAttributes(): string[] {
    return ['value'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'value' && newValue !== oldValue) {
      this.value = newValue;
    }
  }
}

customElements.define('input-color-picker', InputColorPicker, { extends: 'input' });

// Example usage:
// Method 1: Create via HTML
// <input is="input-color-picker" value="#ff0000">

// Method 2: Create via JavaScript
/*
const colorPicker = document.createElement('input', { is: 'input-color-picker' });
colorPicker.value = '#00ff00'; // Set green color
colorPicker.addEventListener('colorchange', (event) => {
  console.log('Selected color:', event.detail.value);
});
document.body.appendChild(colorPicker);
*/

// Method 3: Create and test function (uncomment to test)
/*
function createColorPickerExample() {
  const container = document.createElement('div');
  container.style.cssText = 'margin: 20px; padding: 20px; border: 1px solid #ccc;';
  
  const title = document.createElement('h3');
  title.textContent = 'Color Picker Examples:';
  container.appendChild(title);
  
  // Example 1: Default white color
  const picker1 = document.createElement('input', { is: 'input-color-picker' });
  const label1 = document.createElement('label');
  label1.textContent = 'Default (white): ';
  label1.appendChild(picker1);
  container.appendChild(label1);
  container.appendChild(document.createElement('br'));
  
  // Example 2: Red color
  const picker2 = document.createElement('input', { is: 'input-color-picker' });
  picker2.value = '#ff0000';
  const label2 = document.createElement('label');
  label2.textContent = 'Red: ';
  label2.appendChild(picker2);
  container.appendChild(label2);
  container.appendChild(document.createElement('br'));
  
  // Example 3: Invalid color (will become white)
  const picker3 = document.createElement('input', { is: 'input-color-picker' });
  picker3.value = 'invalid-color';
  const label3 = document.createElement('label');
  label3.textContent = 'Invalid color (becomes white): ';
  label3.appendChild(picker3);
  container.appendChild(label3);
  container.appendChild(document.createElement('br'));
  
  // Add event listeners
  [picker1, picker2, picker3].forEach((picker, index) => {
    picker.addEventListener('colorchange', (event) => {
      console.log(`Picker ${index + 1} color changed to:`, event.detail.value);
    });
  });
  
  document.body.appendChild(container);
}

// Uncomment the line below to test:
// createColorPickerExample();
*/

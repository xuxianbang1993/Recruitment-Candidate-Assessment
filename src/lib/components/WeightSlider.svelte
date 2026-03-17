<script lang="ts">
  let { name, weight, onchange }: {
    name: string
    weight: number
    onchange: (value: number) => void
  } = $props()
</script>

<div class="flex items-center gap-3">
  <span class="text-sm flex-shrink-0 w-24" style="color: #1A1D23;">{name}</span>

  <div class="flex-1 relative">
    <input
      type="range"
      min="0"
      max="100"
      value={weight}
      oninput={(e) => onchange(Number((e.target as HTMLInputElement).value))}
      class="w-full h-1.5 appearance-none rounded-full cursor-pointer"
      style="
        background: linear-gradient(to right, #D4763C {weight}%, #E8E5E0 {weight}%);
        accent-color: #D4763C;
      "
    />
  </div>

  <div
    class="text-sm font-semibold w-10 text-right flex-shrink-0"
    style="color: {weight > 0 ? '#D4763C' : '#6B7280'};"
  >
    {weight}%
  </div>
</div>

<style>
  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #D4763C;
    border-radius: 50%;
    border: 2px solid #FFFFFF;
    box-shadow: 0 1px 4px rgba(212,118,60,0.4);
    cursor: pointer;
  }
  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #D4763C;
    border-radius: 50%;
    border: 2px solid #FFFFFF;
    box-shadow: 0 1px 4px rgba(212,118,60,0.4);
    cursor: pointer;
  }
</style>

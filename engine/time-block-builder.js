
export function buildTimeBlocks(events, options = {}) {
  if (!Array.isArray(events)) {
    throw new Error("events must be an array.");
  }

  const start = new Date(options.startTime);
  const end = new Date(options.endTime);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start >= end
  ) {
    throw new Error("Invalid schedule time range.");
  }

  const mergeSimultaneousEvents =
    options.mergeSimultaneousEvents !== false;

  const minimumBlockMinutes =
    Number.isFinite(options.minimumBlockMinutes)
      ? Math.max(0, options.minimumBlockMinutes)
      : 15;

  const importantEventIds = new Set(
    Array.isArray(options.importantEventIds)
      ? options.importantEventIds
      : []
  );

  const boundaries = [
    {
      time: start,
      event: null
    },
    {
      time: end,
      event: null
    }
  ];

  for (const event of events) {
    if (!event || !event.exactTime) {
      continue;
    }

    const eventTime = new Date(event.exactTime);

    if (
      Number.isNaN(eventTime.getTime()) ||
      eventTime <= start ||
      eventTime >= end
    ) {
      continue;
    }

    boundaries.push({
      time: eventTime,
      event
    });
  }

  boundaries.sort(
    (a, b) => a.time.getTime() - b.time.getTime()
  );

  const uniqueBoundaries = [];

  for (const boundary of boundaries) {
    const previous =
      uniqueBoundaries[uniqueBoundaries.length - 1];

    if (
      mergeSimultaneousEvents &&
      previous &&
      boundary.time.getTime() === previous.time.getTime()
    ) {
      if (boundary.event) {
        if (!previous.events) {
          previous.events = [];
        }

        previous.events.push(boundary.event);
      }

      continue;
    }

    uniqueBoundaries.push({
      time: boundary.time,
      events: boundary.event ? [boundary.event] : []
    });
  }

  let blocks = [];

  for (let i = 0; i < uniqueBoundaries.length - 1; i++) {
    const blockStart = uniqueBoundaries[i];
    const blockEnd = uniqueBoundaries[i + 1];

    const durationMinutes =
      (blockEnd.time.getTime() - blockStart.time.getTime()) /
      60000;

    if (durationMinutes <= 0) {
      continue;
    }

    blocks.push({
      startTime: blockStart.time.toISOString(),
      endTime: blockEnd.time.toISOString(),
      midpoint: new Date(
        (blockStart.time.getTime() + blockEnd.time.getTime()) / 2
      ).toISOString(),
      durationMinutes,
      startEvents: blockStart.events,
      endEvents: blockEnd.events
    });
  }

  // 短い時間帯を、重要なイベントがなければ隣接ブロックへ統合する
  let changed = true;

  while (changed) {
    changed = false;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      if (block.durationMinutes >= minimumBlockMinutes) {
        continue;
      }

      const boundaryEvents = [
        ...block.startEvents,
        ...block.endEvents
      ];

      const hasImportantEvent = boundaryEvents.some(event =>
        importantEventIds.has(event.id)
      );

      if (hasImportantEvent) {
        continue;
      }

      if (blocks.length <= 1) {
        continue;
      }

      const previous = i > 0 ? blocks[i - 1] : null;
      const next =
        i < blocks.length - 1 ? blocks[i + 1] : null;

      let targetIndex;

      if (!previous) {
        targetIndex = i + 1;
      } else if (!next) {
        targetIndex = i - 1;
      } else {
        targetIndex =
          previous.durationMinutes <= next.durationMinutes
            ? i - 1
            : i + 1;
      }

      const target = blocks[targetIndex];

      const mergedStart =
        targetIndex < i ? target.startTime : block.startTime;

      const mergedEnd =
        targetIndex > i ? target.endTime : block.endTime;

      const mergedStartEvents =
        targetIndex < i
          ? target.startEvents
          : block.startEvents;

      const mergedEndEvents =
        targetIndex > i
          ? target.endEvents
          : block.endEvents;

      const startMs = new Date(mergedStart).getTime();
      const endMs = new Date(mergedEnd).getTime();

      const mergedBlock = {
        startTime: mergedStart,
        endTime: mergedEnd,
        midpoint: new Date(
          (startMs + endMs) / 2
        ).toISOString(),
        durationMinutes: (endMs - startMs) / 60000,
        startEvents: mergedStartEvents,
        endEvents: mergedEndEvents
      };

      const firstIndex = Math.min(i, targetIndex);

      blocks.splice(firstIndex, 2, mergedBlock);

      changed = true;
      break;
    }
  }

  return blocks;
}

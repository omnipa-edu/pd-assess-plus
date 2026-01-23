import { describe, expect, it, vi, beforeEach } from "vitest";

import { getCompetencyFramework } from "../framework";

const mockFrom = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe("getCompetencyFramework", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("maps active EPAs to framework entries", async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: (resolve: any) =>
        Promise.resolve({
          data: [
            { id: "epa-1", title: "EPA 1", description: "Desc 1" },
            { id: "epa-2", title: "EPA 2", description: "Desc 2" },
          ],
          error: null,
        }).then(resolve),
    };

    mockFrom.mockReturnValue(query);

    const result = await getCompetencyFramework(null);

    expect(result).toEqual([
      { id: "epa-1", name: "EPA 1", definition: "Desc 1" },
      { id: "epa-2", name: "EPA 2", definition: "Desc 2" },
    ]);
  });
});

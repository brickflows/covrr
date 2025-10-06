"use client";

import { useState, useEffect } from "react";
import { Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { BookDetails } from "@/types/canvas";

interface BookDetailsPopoverProps {
  boardId: string;
}

export function BookDetailsPopover({ boardId }: BookDetailsPopoverProps) {
  const [open, setOpen] = useState(false);
  const [bookDetails, setBookDetails] = useState<BookDetails>({
    title: "",
    author: "",
    genres: "",
    audience: "",
    keywords: "",
    mood: "",
    synopsis: "",
    coverRequirements: "",
    thingsToAvoid: "",
    otherDetails: "",
    inspirations: "",
  });

  // Fetch current board data
  const board = useQuery(api.board.get, { id: boardId as Id<"boards"> });
  const updateBookDetails = useMutation(api.board.updateBookDetails);

  // Load existing book details when board data is fetched
  useEffect(() => {
    if (board?.bookDetails) {
      setBookDetails(board.bookDetails);
    }
  }, [board]);

  // Calculate completion percentage
  const calculateCompletionPercentage = () => {
    const fields = [
      bookDetails.title,
      bookDetails.author,
      bookDetails.genres,
      bookDetails.audience,
      bookDetails.keywords,
      bookDetails.mood,
      bookDetails.synopsis,
      bookDetails.coverRequirements,
      bookDetails.thingsToAvoid,
      bookDetails.otherDetails,
      bookDetails.inspirations,
    ];

    const filledFields = fields.filter(field => field && field.trim() !== "").length;
    return (filledFields / fields.length) * 100;
  };

  const completionPercentage = calculateCompletionPercentage();

  const handleSave = async () => {
    try {
      await updateBookDetails({
        id: boardId as Id<"boards">,
        bookDetails,
      });
      toast.success("Book details saved successfully!");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to save book details");
      console.error(error);
    }
  };

  const handleInputChange = (field: keyof BookDetails, value: string) => {
    setBookDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="absolute top-2 left-[320px]">
          <Button
            variant="ghost"
            size="icon"
            className="bg-white rounded-md h-12 w-12 flex items-center justify-center shadow-md hover:bg-gray-50 relative"
          >
            <Book className="h-5 w-5" />
          </Button>

          {/* Completion indicator - positioned like the delete button on selected nodes */}
          {completionPercentage > 0 && (
            <div
              className="absolute -top-3 -left-3 bg-white rounded-md px-1.5 py-0.5 shadow-md border border-gray-200 flex items-center justify-center"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                letterSpacing: '-0.02em',
                fontWeight: '600',
                minWidth: '32px',
                height: '20px',
              }}
            >
              <span style={{
                color: completionPercentage === 100 ? '#10b981' : '#3b82f6',
              }}>
                {completionPercentage === 100 ? '✓' : `${Math.round(completionPercentage)}%`}
              </span>
            </div>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-[400px] max-h-[600px] overflow-y-auto" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Book Details</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Book Title</Label>
              <Input
                id="title"
                placeholder="Enter book title"
                value={bookDetails.title || ""}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Author Name</Label>
              <Input
                id="author"
                placeholder="Enter author name"
                value={bookDetails.author || ""}
                onChange={(e) => handleInputChange("author", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genres">Genres</Label>
              <Textarea
                id="genres"
                placeholder="Fantasy, Romance, Mystery (comma-separated)"
                value={bookDetails.genres || ""}
                onChange={(e) => handleInputChange("genres", e.target.value)}
                rows={2}
                className="resize-none min-h-[60px]"
                style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", overflowWrap: "break-word" }}
              />
              <p className="text-xs text-gray-500">Separate multiple genres with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Textarea
                id="audience"
                placeholder="Young Adult, Adults, Children (comma-separated)"
                value={bookDetails.audience || ""}
                onChange={(e) => handleInputChange("audience", e.target.value)}
                rows={2}
                className="resize-none min-h-[60px]"
                style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", overflowWrap: "break-word" }}
              />
              <p className="text-xs text-gray-500">Separate multiple audiences with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Textarea
                id="keywords"
                placeholder="Magic, Adventure, Love (comma-separated)"
                value={bookDetails.keywords || ""}
                onChange={(e) => handleInputChange("keywords", e.target.value)}
                rows={2}
                className="resize-none min-h-[60px]"
                style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", overflowWrap: "break-word" }}
              />
              <p className="text-xs text-gray-500">Separate keywords with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood">Mood & Tone</Label>
              <Textarea
                id="mood"
                placeholder="Whimsical, dark, hopeful..."
                value={bookDetails.mood || ""}
                onChange={(e) => handleInputChange("mood", e.target.value)}
                rows={2}
                className="resize-none min-h-[60px]"
                style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", overflowWrap: "break-word" }}
              />
              <p className="text-xs text-gray-500">Use commas to list multiple moods</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="synopsis">Synopsis</Label>
              <Textarea
                id="synopsis"
                placeholder="Brief description of your book's plot..."
                value={bookDetails.synopsis || ""}
                onChange={(e) => handleInputChange("synopsis", e.target.value)}
                rows={4}
                className="resize-none"
                style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", overflowWrap: "break-word" }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverRequirements">Cover Design Requirements</Label>
              <Textarea
                id="coverRequirements"
                placeholder="Specific elements you want on the cover..."
                value={bookDetails.coverRequirements || ""}
                onChange={(e) => handleInputChange("coverRequirements", e.target.value)}
                rows={3}
                className="resize-none"
                style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", overflowWrap: "break-word" }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thingsToAvoid">Things to Avoid</Label>
              <Textarea
                id="thingsToAvoid"
                placeholder="Elements or themes to avoid in the design..."
                value={bookDetails.thingsToAvoid || ""}
                onChange={(e) => handleInputChange("thingsToAvoid", e.target.value)}
                rows={3}
                className="resize-none"
                style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", overflowWrap: "break-word" }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherDetails">Other Details</Label>
              <Textarea
                id="otherDetails"
                placeholder="Any additional information about your book..."
                value={bookDetails.otherDetails || ""}
                onChange={(e) => handleInputChange("otherDetails", e.target.value)}
                rows={3}
                className="resize-none"
                style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", overflowWrap: "break-word" }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspirations">Inspirations</Label>
              <Textarea
                id="inspirations"
                placeholder="Books, movies, or other works that inspire your project..."
                value={bookDetails.inspirations || ""}
                onChange={(e) => handleInputChange("inspirations", e.target.value)}
                rows={3}
                className="resize-none"
                style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", overflowWrap: "break-word" }}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Details
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
